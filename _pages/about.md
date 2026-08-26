---
permalink: /
title: "Xiaoyu (Nicholas) Wu"
excerpt: "Xiaoyu Wu is a PhD student at Carnegie Mellon University working on privacy, trustworthy AI, and generative models."
author_profile: true
show_title: false
redirect_from:
  - /about/
  - /about.html
---
{% include base_path %}

<div class="home-shell">
  <header class="home-hero">
    <p class="home-hero__eyebrow">Xiaoyu (Nicholas) Wu · 吴晓宇</p>
    <h1>Hi, I'm Xiaoyu Wu</h1>
    <p class="home-hero__role">PhD student · Carnegie Mellon University</p>
    <p class="home-hero__lead">
      I work on trustworthy generative AI: privacy and copyright risks in diffusion and language
      models, and methods that make generative systems more reliable.
    </p>
  </header>

  <section class="home-section home-news" aria-labelledby="news-heading">
    <h2 id="news-heading">News</h2>
    <ul>
      <li>
        <time datetime="2026-05">May 2026</time>
        <span><span class="home-badge">new</span> Released <a href="https://a-little-hoof.github.io/dit-register/">DSR</a>, our work on taming outlier tokens in diffusion transformers.</span>
      </li>
      <li>
        <time datetime="2026-03">Mar 2026</time>
        <span><span class="home-badge">new</span> Our work on the corruption stage in few-shot diffusion fine-tuning was accepted to <strong>KDD 2026</strong>.</span>
      </li>
      <li>
        <time datetime="2025-09">Sep 2025</time>
        <span>Our work on extracting forgotten data after exact unlearning was accepted to <strong>NeurIPS 2025</strong>.</span>
      </li>
      <li>
        <time datetime="2025-05">May 2025</time>
        <span><a href="https://arxiv.org/abs/2410.03039">FineXtract</a>, our training-data extraction work for personalized diffusion models, was accepted to <strong>ICML 2025</strong>.</span>
      </li>
      <li>
        <time datetime="2025-05">May 2025</time>
        <span>Our team won all four tracks of the <a href="https://vectorinstitute.github.io/MIDST/">MIDST Challenge</a> at SaTML 2025.</span>
      </li>
    </ul>
  </section>

  <section class="home-section" aria-labelledby="selected-work-heading">
    <h2 id="selected-work-heading">Selected work</h2>

    {% assign featured_publications = site.publications | where: "featured", true | sort: "date" | reverse %}
    <div class="publication-cards">
      {% for post in featured_publications limit: 2 %}
        {% assign feature_url = post.projecturl | default: post.paperurl %}
        <article class="publication-card">
          <a class="publication-card__visual" href="{{ feature_url }}">
            <img src="{{ post.thumbnail | prepend: base_path }}" alt="{{ post.thumbnail_alt | escape }}" loading="lazy">
          </a>
          <div class="publication-card__body">
            <p class="publication-card__venue">{{ post.venue_label | default: post.venue }} · {{ post.date | date: "%Y" }}</p>
            <h3><a href="{{ feature_url }}">{{ post.title }}</a></h3>
            <p class="publication-card__authors">{{ post.authors }}</p>
            <p class="publication-card__summary">{{ post.excerpt }}</p>
            <div class="publication-links" aria-label="Links for {{ post.title | escape }}">
              {% if post.paperurl %}<a href="{{ post.paperurl }}">Paper</a>{% endif %}
              {% if post.projecturl %}<a href="{{ post.projecturl }}">Project</a>{% endif %}
              {% if post.codeurl %}<a href="{{ post.codeurl }}">Code</a>{% endif %}
            </div>
          </div>
        </article>
      {% endfor %}
    </div>

    <a class="home-see-all" href="{{ base_path }}/publications/">See all publications <span aria-hidden="true">→</span></a>
  </section>

  <section class="home-section home-about" aria-labelledby="about-heading">
    <h2 id="about-heading">About</h2>
    <p>
      I'm a PhD student at Carnegie Mellon University, where I work with
      <a href="https://mireshghallah.github.io/">Prof. Niloofar Mireshghallah</a>,
      <a href="https://zstevenwu.com/">Prof. Zhiwei Steven Wu</a>, and
      <a href="https://andrewilyas.com/">Prof. Andrew Ilyas</a>. My research spans data extraction,
      machine unlearning, membership inference, copyright protection, and the robustness of generative models.
      I also collaborate with <a href="https://weichen582.github.io/">Prof. Chen Wei</a> on generative modeling.
    </p>
    <p>
      I co-founded a volunteer group focused on copyright issues surrounding image generation. We build
      open-source tools and provide technical support for AI copyright litigation.
    </p>
  </section>
</div>
