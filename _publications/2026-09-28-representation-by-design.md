---
title: "Representation by Design in Generation: Cross-View Class-Token Alignment in Diffusion Transformers"
collection: publications
category: conferences
permalink: /publication/2026-09-28-representation-by-design
excerpt: >-
  Cross-view class-token alignment improves ImageNet linear-probe accuracy by 9.4 percentage points while preserving comparable generation quality.
date: 2026-09-28
venue: "arXiv preprint"
venue_label: "Preprint"
authors: "<strong>Xiaoyu Wu</strong>, Yifei Wang, Chen Wei"
paperurl: "https://arxiv.org/abs/2609.36348"
featured: true
featured_order: 3
thumbnail: "/images/publications/cross-view-alignment.png"
thumbnail_alt: "Training diagram aligning student and teacher class tokens across two independently noised diffusion views"
citation: 'Wu, X., Wang, Y., and Wei, C. (2026). "Representation by Design in Generation: Cross-View Class-Token Alignment in Diffusion Transformers." <i>arXiv:2609.36348</i>.'
---

We train diffusion transformers to learn stronger semantic representations alongside generation. Aligning class tokens across independently noised views improves both global and patch features: ImageNet class-token linear probing gains 9.4 percentage points and frozen-backbone VOC2012 segmentation gains 3.6 mIoU, with comparable ImageNet generation FID.
