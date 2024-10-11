---
title: "Exploring Diffusion Models' Corruption Stage in Few-Shot Fine-Tuning and Mitigating with Bayesian Neural Networks"  
collection: publications  
category: conferences  
permalink: /publications/2024-05-19-dm-corruption-stage-few-shot  
excerpt: |
    This paper explores diffusion models' corruption stage in few-shot fine-tuning and proposes using Bayesian Neural Networks to mitigate image quality degradation.
date: 2024-05-19  
venue: 'Under Review'  
paperurl: 'https://arxiv.org/abs/2405.19931'  
citation: |
    Wu X*, Zhang J*, Hua Y, et al. (2024). "Exploring Diffusion Models' Corruption Stage in Few-Shot Fine-Tuning and Mitigating with Bayesian Neural Networks." <i>arXiv preprint arXiv:2405.19931</i>. (Co-First Author)
---
This paper observes an interesting phenomenon during the few-shot fine-tuning process of diffusion models, termed the "corruption stage." In this stage, the model's output exhibits corrupted patterns, leading to a noticeable decrease in quality. We approximate this behavior using a Gaussian distribution and determine that the issue arises from the limited learned distribution. To address this, we apply Bayesian Neural Networks (BNNs) to force the diffusion models to learn a broader manifold, which has proven effective in resolving the corruption issue.
