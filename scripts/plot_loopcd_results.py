"""Replot the two cited LoopCD comparisons for desktop and mobile layouts."""
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


ASSETS = Path(__file__).resolve().parents[1] / "blog/guidance-in-looped-models"
COLORS = {"baseline": "#adb7b3", "fixed": "#225b87"}
PAPER = "#fcfbf8"


def draw_panel(ax, panel, metric):
    rows = panel["rows"]
    baseline = rows[0]["score"]
    positions = list(range(len(rows)))
    ax.set_facecolor(PAPER)
    ax.bar(positions, [row["score"] for row in rows], width=0.59,
           color=[COLORS[row["kind"]] for row in rows], zorder=3)
    for x, row in zip(positions, rows):
        score = row["score"]
        ax.text(x, score + 2, f"{score:.2f}", ha="center", va="bottom",
                fontsize=16, weight="semibold")
        if row["kind"] != "baseline":
            ax.text(x, score + 10, f"+{score - baseline:.2f} pp", ha="center",
                    va="bottom", fontsize=13, color=COLORS[row["kind"]])
    ax.set_ylim(0, 100)
    ax.set_yticks([0, 20, 40, 60, 80, 100])
    ax.set_xlim(-0.65, len(rows) - 0.35)
    ax.set_xticks(positions, [row["label"] for row in rows])
    ax.tick_params(axis="x", length=0, pad=10, labelsize=14)
    ax.tick_params(axis="y", length=0, pad=7, labelsize=13)
    ax.set_ylabel(metric, fontsize=14, labelpad=8)
    ax.grid(axis="y", color="#dfe3e0", linewidth=0.7, zorder=0)
    for name in ["top", "right", "left"]:
        ax.spines[name].set_visible(False)
    ax.spines["bottom"].set_color("#c6cbc9")
    ax.text(0, 1.30, panel["title"], transform=ax.transAxes, fontsize=18,
            weight="semibold", va="bottom")
    ax.text(0, 1.19, f'{panel["model"]} / {panel["benchmark"]}',
            transform=ax.transAxes, fontsize=13, va="bottom")
    ax.text(0, 1.08, f'Loop {panel["reference_loop"]} guides loop {panel["loops"]}',
            transform=ax.transAxes, fontsize=13, color="#535b60", va="bottom")


def main():
    data = json.loads((ASSETS / "loopcd-results-data.json").read_text())
    plt.rcParams.update({
        "font.family": "DejaVu Sans", "font.size": 14,
        "text.color": "#282b2d", "axes.labelcolor": "#535b60",
        "xtick.color": "#282b2d", "ytick.color": "#535b60",
        "figure.facecolor": PAPER, "savefig.facecolor": PAPER,
        "svg.fonttype": "none", "svg.hashsalt": "loopcd-results",
    })
    for mobile in [False, True]:
        fig, axes = plt.subplots(2 if mobile else 1, 1 if mobile else 2,
                                 figsize=(5.2, 9.5) if mobile else (10.6, 4.9))
        for ax, panel in zip(axes.flat, data["panels"]):
            draw_panel(ax, panel, data["metric"])
        if mobile:
            fig.subplots_adjust(left=0.15, right=0.98, top=0.86, bottom=0.06, hspace=0.75)
        else:
            fig.subplots_adjust(left=0.075, right=0.99, top=0.73, bottom=0.13, wspace=0.30)
        stem = "loopcd-results-mobile" if mobile else "loopcd-results"
        for ext in ["svg", "png"]:
            metadata = {"Date": None} if ext == "svg" else None
            fig.savefig(ASSETS / f"{stem}.{ext}", dpi=144, metadata=metadata)
        plt.close(fig)
        print(f"Rendered {stem}.svg and {stem}.png")


if __name__ == "__main__":
    main()
