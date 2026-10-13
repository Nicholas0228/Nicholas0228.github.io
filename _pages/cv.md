---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---
{% include base_path %}

[Download CV (PDF)]({{ base_path }}/files/Xiaoyu_Wu_CV.pdf){: .research-scholar-link }

## Research Focus

Long-horizon generation, representation learning, and reasoning for generative models. Efficient training and inference; privacy and trustworthy machine learning.

## Education

**Carnegie Mellon University** · August 2026–September 2030 (expected)<br>
Ph.D. student in Societal Computing, School of Computer Science<br>
Software and Societal Systems Department<br>
Advisors: [Zhiwei Steven Wu](https://zstevenwu.com/), [Niloofar Mireshghallah](https://mireshghallah.github.io/), and [Andrew Ilyas](https://andrewilyas.com/)

**Rice University** · September 2025–June 2026<br>
Ph.D. studies in Computer Science<br>
Research with [Chen Wei](https://weichen582.github.io/)

**Shanghai Jiao Tong University** · September 2022–March 2025<br>
M.Sc. in Computer Science

**Shanghai Jiao Tong University** · September 2018–June 2022<br>
B.S. in Computer Science and Technology

## Publications

[Google Scholar]({{ site.author.googlescholar }}) · * Equal contribution

{% assign cv_publications = site.publications | sort: "date" | reverse %}
<div class="publication-list">
  {% for post in cv_publications %}
    <article class="publication-entry">
      <div class="publication-entry__year">{{ post.date | date: "%Y" }}</div>
      <div class="publication-entry__body">
        <p class="publication-entry__venue">{{ post.venue }}</p>
        <h2><a href="{{ post.paperurl }}">{{ post.title }}</a></h2>
        <p class="publication-entry__authors">{{ post.authors }}</p>
        <p class="publication-entry__summary">{{ post.excerpt }}</p>
        <div class="publication-links">
          <a href="{{ post.paperurl }}">Paper</a>
          {% if post.projecturl %}<a href="{{ post.projecturl }}">Project</a>{% endif %}
          {% if post.codeurl %}<a href="{{ post.codeurl }}">Code</a>{% endif %}
        </div>
      </div>
    </article>
  {% endfor %}
</div>

## Awards

**MIDST Challenge, SaTML 2025 — Winning team, all four tracks.**<br>
Membership inference on diffusion-based synthetic tabular data.<br>
[Challenge results](https://vectorinstitute.github.io/MIDST/) · [Related work: TPDP 2025 workshop](https://tpdp.journalprivacyconfidentiality.org/2025/)

## Open Source Impact

**Mist — Founder and main developer.**<br>
1,000+ combined GitHub stars across [Mist](https://github.com/psyker-team/mist) and [Mist-v2](https://github.com/psyker-team/mist-v2); featured in [The Verge](https://www.theverge.com/24063327/ai-art-protect-images-copyright-generators).<br>
Social engagement: 16K reposts and 20K likes.

## Academic Service

Reviewer: ECCV, ICML, NeurIPS, ICLR.
