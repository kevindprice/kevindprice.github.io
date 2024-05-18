---
layout: post
title: How Humanity Discovered the Area of a Circle
category: Mathematics
tags: [Mathematics]
slug: area-of-circle
authors: Kevin Price
---
<!-- Summary:  -->

<!-- PELICAN_END_SUMMARY -->


I was recently thinking about the widely-known equation for the area of a circle, $$A=\pi r^2$$. I realized that even though I have taught this equation to dozens of students, I did not know how the equation is derived. In other words, yes this is the correct equation. But *why* is it? Furthermore, how did humanity arrive at this equation anciently? In my search for an intuitive answer, I found myself liking an approach using regular figures the best. This is more or less the approach that Archimedes (287-212 BC) used to prove $$A= \pi r^2$$.

### Archimedes' Method
Before I dive into the regular shapes that Archimedes used, I will start simple: with the area of a triangle. It makes sense that the area of a triangle is $$A=\frac{1}{2}bh$$ because a triangle is a rectangle cut in half. You can draw a rectangle and call one side "b" for base and the other "h" for height ($$A=bh$$). Cut it in half and it will produce two triangles. So, since cutting a rectangle in half makes a triangle, we know that the area of a triangle is $$A=\frac{1}{2}bh$$.

![square](/images/square.png "A triangle is a square cut in half.")

This helps me prove another well-established formula, the formula for the area of a regular shape. A *regular* shape is one that has all congruent/equal sides and angles. Here is a regular hexagon. You can see that it is made up of six equal sides, which also gives us six equal triangles.

![hexagon](/images/hexagon.png "Finding the area of a regular hexagon")

Let's look at the bottom triangle. Just like any triangle, we have a base, "b", and a height, "h". For any one of the triangles, the area is $$A=\frac{1}{2} bh$$. You could just multiply this by six identical triangles to get the area of the whole hexagon, or $$A=6*\frac{1}{2} bh$$. It makes sense that the area for the entire shape is just based on the number of sides or triangles in that shape. We can replace the "6" in this formula with a placeholder "n" to denote the number of sides. This allows us to step past hexagons to a regular shape with any number of sides.

$$A=n*\frac{1}{2} bh$$&nbsp;

$$n$$ is the number of sides in a regular shape. $$\frac{1}{2}bh$$ is the area of each triangle in the shape.

We can see that $$n*b$$, or the number of sides times the length of one side, just equals the *perimeter*, the distance around the shape. We can substitute $$nb=p$$ to drop the number of sides and just focus on the distance around the shape.

Using the the formula above (rearranged),

$$A=\frac{1}{2} h*nb$$&nbsp;

we get

$$A=\frac{1}{2} hp$$&nbsp;

where $$p$$ is the perimeter and $$h$$ is the height of one of the triangles.

Next, in geometry, this "$$h$$" from the diagram is called an *apothem*, or the line from the center to the side of a regular shape. So instead of "$$h$$" I will call it $$a$$. This gives us a standard equation I like to teach.

The area of a regular shape:
$$A=\frac{1}{2}ap$$: $$a$$ is for apothem and $$p$$ is for perimeter.

What happens if we increase the number of sides to infinity? This shape would  become a circle. We call the *perimeter* of this shape the *circumference* (C), and the *apothem* would become equivalent to a *radius* (r). Here, at 16 sides (below), the shape already begins to look like a circle.

![circle](/images/circle.png "A circle is a regular shape with infinite sides.")

We just studied what happens when the number of sides of a regular figure approaches infinity: it becomes a circle. We will rename the variables from the last formula for more circle-friendly variables.

From the formula above, $$A=\frac{1}{2}ap$$, we get:
$$A=\frac{1}{2} rC$$, where C is circumference and r is radius.

The formula for circumference is $$C=\pi d$$, or pi times the diameter. This formula is, in fact, how $$\pi$$ is defined: it is the ratio between the circumference and the diameter of a circle. We usually write this formula as $$C=2\pi r$$ because the diameter is double the radius. Let's put this into our formula.

From above, we have:

$$A=\frac{1}{2} Cr$$&nbsp;

Substitute $$2 \pi r=C$$:

$$A=\frac{1}{2} * 2 \pi r* r$$&nbsp;

Therefore,

$$A=\pi r^2$$&nbsp;

### Conclusion
Here we have Archimedes' method for deriving the area of a circle. Centuries later, others have pondered this same question and have given us additional methods to prove $$A=\pi r^2$$. In modern times, calculus can also be used to derive this equation.

As we look at the formulas we learn in school from a historical perspective, we can appreciate how the modern world of mathematics came to be.

For more information, visit ["Area of a Circle" on Wikipedia](https://en.wikipedia.org/wiki/Area_of_a_circle).
Figures were produced using [GeoGebra](https://www.math10.com/en/geometry/geogebra/fullscreen.html).
