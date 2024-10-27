---
layout: archive
# title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---
{% include base_path %}

# Education

* M.S. in Shanghai Jiao Tong University, 2025 (expected)
* B.S. in Shanghai Jiao Tong University, 2022

# Research Interests

* Trustworthy AI: Mainly on copyright protection and authentication w./against AI personalization.
* Privacy and Security: Adversarial attack and defense, data extraction, membship inference attack
* Diffusion Models

# Research Experience




**[Under Review]** Data Extraction on Personalized Generative Models  
Instructor: Steven Wu (CMU)  
May. 2024 — Present  

- Revealed the data leakage threat for large personalized generative models  by performing successful exact data extraction, providing strong evidence of potential infringements.  
- Utilized guidance between pretrained and fine-tuned models to generate within high-density regions of the fine-tuned data probability distribution, enabling precise data extraction.

**[ICML 2023 (Oral) & CVPR 2024]** Copyright Authentication and Imitation Prevention for Diffusion Models  
Oct. 2022 — May. 2024  
Instructor: Yang Hua (QUB), Hao Wang (LSU), Tao Song (SJTU)  

- Crafted a visualizable copyright authentication mechanism by modeling and analyzing the conceptual difference between fine-tuned and pretrained diffusion models theoretically.  
- Established a framework to craft adversarial watermarks against unauthorized diffusion model-based artwork mimicry by modeling adversarial attacks on diffusion models theoretically.


# Selected Publications

<ul>{% for post in site.publications reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>

# Service

* Reviewers for NeurIPS 2024, ICLR 2025.
