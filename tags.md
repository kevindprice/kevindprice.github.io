---
layout: tags
description: "An archive of posts sorted by tag."
permalink: /tags
comment: true
---

## Tag Archive

{% capture site_tags %}{% for tag in site.tags %}{{ tag | first }}{% unless forloop.last %},{% endunless %}{% endfor %}{% endcapture %}
{% assign tags_list = site_tags | split:',' | sort %}
<ul class="entry-meta">
  {% for item in (0..site.tags.size) %}{% unless forloop.last %}
  {% capture this_word %}{{ tags_list[item] | strip_newlines }}{% endcapture %}
  {% if this_word != null and this_word != "" %}
  <li><a href="#{{ this_word | url_encode }}" class="tag"><span class="term">{{ this_word }}</span></a><span class="count"> ({{ site.tags[this_word].size }})</span></li>
  {% endif %}{% endunless %}{% endfor %}
</ul>
<br/>
{% for item in (0..site.tags.size) %}{% unless forloop.last %}
{% capture this_word %}{{ tags_list[item] | strip_newlines }}{% endcapture %}
   <h3 id="{{ this_word | url_encode }}" class="red-title">{{ this_word }}</h3> <!--url_encode changes spaces to plus signs-->
   <ul>
    {% for post in site.tags[this_word] %}{% if post.title != null %}
    <li class="entry-title">{{ post.date | date: "%Y" }}: <a href="{{ post.url }}" title="{{ post.title }}">{{ post.title }}</a></li>
    {% endif %}{% endfor %}<br/>
  </ul>
{% endunless %}{% endfor %}
