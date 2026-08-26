---
title: "Taming Outlier Tokens in Diffusion Transformers"
collection: publications
category: conferences
permalink: /publication/2026-05-06-taming-outlier-tokens
excerpt: >-
  Dual-Stage Registers reduce harmful outlier tokens in both vision encoders and diffusion transformers, improving generation quality across ImageNet and text-to-image settings.
date: 2026-05-06
venue: "arXiv preprint"
venue_label: "Preprint"
authors: "<strong>Xiaoyu Wu*</strong>, Yifei Wang*, Tsu-Jui Fu, Liang-Chieh Chen, Zhe Gan, Chen Wei"
paperurl: "https://arxiv.org/abs/2605.05206"
projecturl: "https://a-little-hoof.github.io/dit-register/"
codeurl: "https://github.com/a-little-hoof/DSR"
featured: true
thumbnail: "/images/publications/dsr-outlier-tokens.jpg"
thumbnail_alt: "Layer-wise token maps showing the effect of Dual-Stage Registers"
citation: 'Wu, X.*, Wang, Y.*, Fu, T.-J., et al. (2026). "Taming Outlier Tokens in Diffusion Transformers." <i>arXiv:2605.05206</i>.'
---

We show that high-norm outlier tokens appear in both pretrained vision encoders and diffusion transformers, where they degrade local patch semantics. Dual-Stage Registers address both sources with lightweight interventions that improve generation quality.
