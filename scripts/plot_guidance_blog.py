"""Render the blog figure from frozen, audited aggregate data (no GPU needed)."""
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FixedLocator, FuncFormatter, NullLocator


def main():
    assets = Path(__file__).resolve().parents[1] / "blog/guidance-in-looped-models"
    data = json.loads((assets / "plot-data.json").read_text())
    plt.rcParams.update({
        "font.family": "DejaVu Sans", "font.size": 12,
        "axes.spines.top": False, "axes.spines.right": False,
        "axes.edgecolor": "#c6cbc9", "text.color": "#282b2d",
        "axes.labelcolor": "#42484c", "xtick.color": "#535b60",
        "ytick.color": "#535b60", "svg.fonttype": "none", "svg.hashsalt": "guidance-blog",
        "pdf.fonttype": 42,
        "savefig.facecolor": "#fcfbf8", "figure.facecolor": "#fcfbf8",
    })
    fig, axes = plt.subplots(1, 2, figsize=(12, 5.5))
    colors = {"huginn": "#207a65", "ouro": "#225b87", "qwen": "#b4773a", "pythia": "#956b8b"}
    markers = {"huginn": "o", "ouro": "s", "qwen": "^", "pythia": "D"}
    metrics = [("centered_logit_rms", "A  Change in next-token scores", "Logit change (centered RMS)", [0, 1, 2, 3, 4, 5]),
               ("relative_centered_rms", "B  Same change, adjusted for scale", "Change / final-logit centered RMS", [0, .5, 1, 1.5, 2])]
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
        ax.set_title(title, loc="left", fontsize=13, pad=20, weight="medium")
        ax.set_xlabel("Intermediate loop / layer (% of final depth)", labelpad=12, fontsize=10)
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
    fig.legend(handles, labels, loc="lower center", bbox_to_anchor=(.51, .035), ncol=2,
               frameon=False, fontsize=11, columnspacing=3.5, handlelength=2.6)
    fig.subplots_adjust(left=.075, right=.98, top=.88, bottom=.26, wspace=.32)
    for ext in ["svg", "pdf", "png"]:
        target = assets / f"logit-gaps.{ext}"
        metadata = {"Date": None} if ext == "svg" else {"CreationDate": None, "ModDate": None} if ext == "pdf" else None
        fig.savefig(target, dpi=120, metadata=metadata)
        if ext == "svg":
            target.write_text("\n".join(line.rstrip() for line in target.read_text().splitlines()) + "\n")
    plt.close(fig)
    print("Rendered logit-gaps.svg, .pdf and .png from audited aggregates.")


if __name__ == "__main__":
    main()
