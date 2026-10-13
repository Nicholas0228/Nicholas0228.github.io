---
title: "Accelerating Inference of Discrete Autoregressive Normalizing Flows by Selective Jacobi Decoding"
collection: publications
category: conferences
permalink: /publication/2026-05-01-selective-jacobi-decoding
excerpt: >-
  Selective Jacobi decoding speeds up autoregressive normalizing-flow inference by up to 4.7 times while preserving generation quality, without additional training.
date: 2026-05-01
venue: "TMLR 2026 (Featured Certification)"
venue_label: "TMLR Featured"
authors: "Jiaru Zhang, Juanwu Lu, <strong>Xiaoyu Wu</strong>, Ziran Wang, Ruqi Zhang"
paperurl: "https://openreview.net/forum?id=xYATz9HpE7"
proceedingsurl: "https://openreview.net/forum?id=xYATz9HpE7"
codeurl: "https://github.com/lan-qing/SJD"
citation: 'Zhang, J., Lu, J., Wu, X., Wang, Z., and Zhang, R. (2026). "Accelerating Inference of Discrete Autoregressive Normalizing Flows by Selective Jacobi Decoding." <i>Transactions on Machine Learning Research</i>. Featured Certification.'
---

Strict sequential inference is unnecessary in parts of autoregressive normalizing flows. We retain sequential decoding for the first layer and apply parallel Jacobi iteration to later layers with more redundant dependencies. The method has convergence guarantees and achieves up to 4.7 times faster inference without retraining or changing the model architecture.
