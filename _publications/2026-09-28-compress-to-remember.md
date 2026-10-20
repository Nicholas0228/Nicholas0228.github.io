---
title: "Compress to Remember: Learning Compact Memory via On-Policy Distillation for Long Video Generation"
collection: publications
category: conferences
permalink: /publication/2026-09-28-compress-to-remember
excerpt: >-
  PACC learns compact memory from a frozen video generator, retaining earlier events and improving consistency in long video generation.
date: 2026-09-28
venue: "arXiv preprint"
venue_label: "Preprint"
authors: "<strong>Xiaoyu Wu*</strong>, Weihang Guo*, Yifei Wang*, Xinze Feng, Lydia E. Kavraki, Zhiwei Steven Wu"
paperurl: "https://arxiv.org/abs/2609.36364"
projecturl: "/blog/compress-to-remember/"
featured: true
featured_order: 1
thumbnail: "/images/publications/compress-to-remember.png"
thumbnail_alt: "PACC trains a memory compressor by matching a frozen video generator conditioned on compressed memory to the same generator with full history"
citation: 'Wu, X.*, Guo, W.*, Wang, Y.*, Feng, X., Kavraki, L. E., and Wu, Z. S. (2026). "Compress to Remember: Learning Compact Memory via On-Policy Distillation for Long Video Generation." <i>arXiv:2609.36364</i>.'
---

Prediction-Aligned Context Compaction (PACC) learns to summarize past video frames into reusable memory tokens. On-policy distillation uses the same frozen generator as a teacher with full history and a student with compressed memory, updating only the compressor. PACC improves memory-event coverage and consistency on MBench while maintaining competitive quality in minute-long generation.
