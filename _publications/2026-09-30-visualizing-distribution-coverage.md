---
title: "Visualizing Distribution Coverage in Generative Diffusion Models"
collection: publications
category: conferences
permalink: /publication/2026-09-30-visualizing-distribution-coverage
excerpt: >-
  Pass@k reveals how distribution-matching distillation trades broad coverage of valid outputs for stronger single-sample quality in image and video generation.
date: 2026-09-30
venue: "arXiv preprint"
venue_label: "Preprint"
authors: "Yifei Wang, <strong>Xiaoyu Wu</strong>, Tsu-Jui Fu, Chen Chen, Liang-Chieh Chen, Zhe Gan, Chen Wei"
paperurl: "https://arxiv.org/abs/2609.38853"
featured: true
featured_order: 4
thumbnail: "/images/publications/distribution-coverage.png"
thumbnail_alt: "Qwen-Image teacher and distilled student samples showing varied teacher compositions and more repetitive student outputs"
citation: 'Wang, Y., Wu, X., Fu, T.-J., Chen, C., Chen, L.-C., Gan, Z., and Wei, C. (2026). "Visualizing Distribution Coverage in Generative Diffusion Models." <i>arXiv:2609.38853</i>.'
---

Single-sample evaluations can hide whether a generator explores the full range of valid outputs. We use pass@k to measure success as the sampling budget grows, finding that distribution-matching objectives improve early-hit rates while reducing large-budget coverage. Consistency and trajectory-based distillation better preserve the teacher's coverage, and the tradeoff also appears in causal video generation.
