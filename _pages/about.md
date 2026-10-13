---
permalink: /
title: "Xiaoyu (Nicholas) Wu"
excerpt: "Xiaoyu Wu is a PhD student at Carnegie Mellon University working on generative models, long-horizon generation, representation learning, and reasoning."
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
      I work on generative models, especially long-horizon video generation,
      representation learning, and reasoning.
    </p>
  </header>

  <section class="home-section home-news" aria-labelledby="news-heading">
    <h2 id="news-heading">News</h2>
    <p class="home-news__hint" id="news-hint">Scroll for earlier updates <span aria-hidden="true">↓</span></p>
    <div class="home-news__timeline" tabindex="0" role="region" aria-label="News timeline, latest updates first" aria-describedby="news-hint">
      <ul>
        {% for item in site.data.news %}
          <li>
            {% if item.date contains "-" %}<time datetime="{{ item.date }}">{{ item.label }}</time>{% else %}<span class="home-news__date">{{ item.label }}</span>{% endif %}
            <span>{% if item.new %}<span class="home-badge">new</span> {% endif %}{{ item.text }}</span>
          </li>
        {% endfor %}
      </ul>
    </div>
  </section>

  <section class="home-section" aria-labelledby="selected-work-heading" data-publication-carousel>
    {% assign featured_publications = site.publications | where: "featured", true | sort: "featured_order" %}
    <div class="home-section__heading">
      <h2 id="selected-work-heading">Selected work</h2>
      <div class="publication-controls" hidden>
        <span class="publication-position" aria-live="polite" aria-atomic="true"></span>
        <button type="button" class="publication-control" data-direction="-1" aria-label="Show newer papers" aria-controls="selected-publications" disabled><span aria-hidden="true">←</span></button>
        <button type="button" class="publication-control" data-direction="1" aria-label="Show older papers" aria-controls="selected-publications"><span aria-hidden="true">→</span></button>
      </div>
    </div>
    <p class="publication-hint" id="publication-hint">Recent work first · Scroll or swipe to explore <span aria-hidden="true">→</span></p>
    <div class="publication-cards" id="selected-publications" tabindex="0" role="region" aria-label="Selected publications, recent work first" aria-describedby="publication-hint">
      {% for post in featured_publications %}
        {% assign feature_url = post.projecturl | default: post.paperurl %}
        <article class="publication-card">
          <a class="publication-card__visual" href="{{ feature_url }}">
            <img src="{{ post.thumbnail | prepend: base_path }}" alt="{{ post.thumbnail_alt | escape }}" loading="lazy" decoding="async">
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
      <a href="https://andrewilyas.com/">Prof. Andrew Ilyas</a>. My research focuses on long-horizon generation,
      representation learning, and reasoning for generative models.
      Previously, I pursued PhD studies at Rice University (September 2025–June 2026),
      working with <a href="https://weichen582.github.io/">Prof. Chen Wei</a>.
    </p>
    <p>
      I founded <a href="https://github.com/psyker-team/mist">Mist</a>, an open-source tool for protecting
      artwork from unauthorized diffusion-model imitation. Our team also won all four tracks of the
      <a href="https://vectorinstitute.github.io/MIDST/">MIDST Challenge</a> at SaTML 2025.
    </p>
  </section>
</div>
<script src="{{ base_path }}/assets/js/publication-carousel.js" defer></script>
