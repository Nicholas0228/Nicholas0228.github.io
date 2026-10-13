---
title: "Scaling Video Generation for Reasoning: At What Cost?"
collection: publications
category: conferences
permalink: /publication/2026-09-29-scaling-video-generation-reasoning
excerpt: >-
  A controlled Rubik's Cube benchmark reveals the compute cost of hidden-state reasoning and why lower generation loss does not guarantee better reasoning.
date: 2026-09-29
venue: "arXiv preprint"
venue_label: "Preprint"
authors: "Weihang Guo, <strong>Xiaoyu Wu</strong>, Yifei Wang, Niloofar Mireshghallah, Lydia E. Kavraki"
paperurl: "https://arxiv.org/abs/2609.36599"
featured: true
featured_order: 2
thumbnail: "/images/publications/video-reasoning.png"
thumbnail_alt: "Rubik's Cube predictions across training checkpoints, showing geometry emerging before correct sticker states"
citation: 'Guo, W., Wu, X., Wang, Y., Mireshghallah, N., and Kavraki, L. E. (2026). "Scaling Video Generation for Reasoning: At What Cost?" <i>arXiv:2609.36599</i>.'
---

We evaluate whether video generators can track hidden state using a simulated 2x2x2 Rubik's Cube with exact ground truth. Plausible geometry emerges before correct sticker configurations, and lower validation loss does not reliably predict reasoning accuracy. Smaller models are more efficient at limited compute; larger models improve with more training, while symbolic state supervision offers a complementary route to stronger reasoning.
