---
title: "Leveraging Model Guidance to Extract Training Data from Personalized Diffusion Models"
collection: publications
category: conferences
permalink: /publication/2024-05-01-personalized-dm-data-extraction
excerpt: >-
  FineXtract uses the distribution shift between pretrained and personalized diffusion models to recover about 20% of fine-tuning data from real-world checkpoints.
date: 2025-05-01
venue: "ICML 2025"
venue_label: "ICML"
authors: "<strong>Xiaoyu Wu</strong>, Jiaru Zhang, Zhiwei Steven Wu"
paperurl: "https://arxiv.org/abs/2410.03039"
proceedingsurl: "https://proceedings.mlr.press/v267/wu25as.html"
projecturl: "https://jiaruzhang.github.io/publication/finextract/"
codeurl: "https://github.com/Nicholas0228/FineXtract"
featured: true
thumbnail: "/images/publications/finextract-results.jpg"
thumbnail_alt: "Extracted images compared with corresponding FineXtract training images"
citation: 'Wu, X., Zhang, J., and Wu, S. (2025). "Leveraging Model Guidance to Extract Training Data from Personalized Diffusion Models." <i>ICML 2025</i>.'
---

FineXtract approximates fine-tuning as a gradual shift from a pretrained diffusion model toward the fine-tuning distribution. Extrapolating along that shift guides generation toward high-probability regions of the private data, while clustering identifies likely training examples.
