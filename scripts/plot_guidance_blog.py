"""Render the blog figure from frozen, audited aggregate data (no GPU needed)."""
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.ticker import FixedLocator, FuncFormatter, NullLocator


def main():
    assets = Path(__file__).resolve().parents[1] / "blog/guidance-in-looped-models"
    data = json.loads((assets / "plot-data.json").read_text())
    font_manager.fontManager.addfont(assets.parent / "compress-to-remember/assets/fonts/Newsreader.ttf")
    plt.rcParams.update({
        "font.family": "Newsreader", "font.size": 16,
        "axes.spines.top": False, "axes.spines.right": False,
        "axes.edgecolor": "#c6cbc9", "text.color": "#282b2d",
        "axes.labelcolor": "#42484c", "xtick.color": "#535b60",
        # SVG images cannot inherit the page's webfont; embed the Newsreader glyphs.
        "ytick.color": "#535b60", "svg.fonttype": "path", "svg.hashsalt": "guidance-blog",
        "pdf.fonttype": 42,
        "savefig.facecolor": "#fcfbf8", "figure.facecolor": "#fcfbf8",
    })
    for mobile in [False, True]:
        render(data, assets, mobile)
    print("Rendered desktop and mobile logit-gap figures from audited aggregates.")


def render(data, assets, mobile):
    fig, axes = plt.subplots(2 if mobile else 1, 1 if mobile else 2,
                             figsize=(6, 10) if mobile else (12, 6))
    colors = {"huginn": "#207a65", "ouro": "#225b87", "qwen": "#b4773a", "pythia": "#956b8b"}
    markers = {"huginn": "o", "ouro": "s", "qwen": "^", "pythia": "D"}
    metrics = [("centered_logit_rms", "A  Change in next-token scores", "Logit change (centered RMS)", [0, 1, 2, 3, 4, 5]),
               ("relative_centered_rms", "B  Same change, adjusted for scale", "Change / final-logit\ncentered RMS", [0, .5, 1, 1.5, 2])]
    for ax, (metric, title, ylabel, ticks) in zip(axes, metrics):
        ax.set_facecolor("#fcfbf8")
        for m in data["models"]:
            points = [d for d in m["depths"] if d["depth"] < m["final_depth"]]
            x = [d["fraction"] for d in points]
            mean = [d[metric]["mean"] for d in points]
            low, high = zip(*(d[metric]["question_bootstrap_95ci"] for d in points))
            color = colors[m["key"]]
            ax.fill_between(x, low, high, color=color, alpha=.16, linewidth=0)
            ax.plot(x, mean, color=color, lw=2, marker=markers[m["key"]], ms=5,
                    ls="-" if m["kind"] == "loop" else "--", label=m["label"])
        ax.set_title(title, loc="left", fontsize=18, pad=20, weight="medium")
        ax.set_xlabel("Intermediate loop / layer\n(% of final depth)", labelpad=12, fontsize=14)
        ax.set_ylabel(ylabel, labelpad=9)
        highest_ci = max(d[metric]["question_bootstrap_95ci"][1]
                         for m in data["models"] for d in m["depths"]
                         if d["depth"] < m["final_depth"])
        ax.set_ylim(0, max(ticks[-1], highest_ci * 1.08))
        ax.set_xlim(0, 1)
        ax.set_xticks([.25, .5, .75, 1], ["25%", "50%", "75%", "100%"])
        ax.yaxis.set_major_locator(FixedLocator(ticks))
        ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:g}"))
        ax.yaxis.set_minor_locator(NullLocator())
        ax.grid(axis="y", color="#dfe3e0", linewidth=.7)
        ax.set_axisbelow(True)
        ax.tick_params(length=3, pad=7)
    handles, labels = axes[0].get_legend_handles_labels()
    legend = fig.legend(handles, labels, loc="lower center", bbox_to_anchor=(.52, .02), ncol=1 if mobile else 2,
                        frameon=False, fontsize=15, columnspacing=2.5, handlelength=2.6)
    if mobile:
        fig.subplots_adjust(left=.22, right=.94, top=.93, bottom=.29, hspace=.65)
    else:
        fig.subplots_adjust(left=.09, right=.96, top=.86, bottom=.32, wspace=.36)
    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    assert not legend.get_window_extent(renderer).overlaps(axes[-1].xaxis.label.get_window_extent(renderer)), (
        mobile, legend.get_window_extent(renderer).bounds, axes[-1].xaxis.label.get_window_extent(renderer).bounds)
    for ax in axes:
        assert ax.yaxis.label.get_window_extent(renderer).x0 >= 0
    for ext in (["svg"] if mobile else ["svg", "pdf", "png"]):
        stem = "logit-gaps-mobile" if mobile else "logit-gaps"
        target = assets / f"{stem}.{ext}"
        metadata = {"Date": None} if ext == "svg" else {"CreationDate": None, "ModDate": None} if ext == "pdf" else None
        fig.savefig(target, dpi=120, metadata=metadata)
        if ext == "svg":
            target.write_text("\n".join(line.rstrip() for line in target.read_text().splitlines()) + "\n")
    plt.close(fig)


if __name__ == "__main__":
    main()
