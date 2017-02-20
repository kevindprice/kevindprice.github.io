/**
  <p>Coriolis Fountain</p>
  <p> a, z -  increase/decrease rotation speed <br>
   s, x -  increase/decrease water pressure <br>
   d, c -  increase/decrease frame rate of animation <br>
   f    -  toggle reference frame <br>
   t    -  toggle tracing </p>
*/ 

int wid = 300,  hig = 300;
float rad = 2 * wid/5;
int nsou = 3,  npts = 50;
float dang = -0.02;           // rotation speed
float prs = 3;                // water pressure
boolean cam = false;          // camera view (fixed to ring)
boolean tra = false;          // trace
int tpt = 0;
int tdrp = 5;              // time between drops (frames)
int fra = 30;              // frame rate
Pts[] pt = new Pts[npts*nsou];
Pts[] tr = new Pts[npts*nsou];
int next = 0, trnext = 0;

//Starting values
float ang = 0, //current angle of the circle (from what reference?)
rot = 2*PI/dang, sep = 2*PI/nsou;   

PFont font;

void setup() {
  size(wid, hig);
  strokeCap(SQUARE); noStroke(); fill(60, 45, 100); 
  for(int i=0; i<npts*nsou; i++) { pt[i] = new Pts( wid, hig, 0.0, 0.0); }
  font = loadFont("Verdana-14.vlw");  textFont(font);
}

void draw() {
  background(210,200,180);
  frameRate(fra);
  translate(wid/2, hig/2);  if(cam) { rotate(ang); }
 
 //draw canvas squares
  fill(100,120,100,40);
  noStroke(); 
  for(int i=0; i<6; i++) { rect(i*wid/6-wid/2+wid/24, -hig/2+hig/24, wid/12, hig-hig/12); }
  for(int i=0; i<6; i++) { rect(-wid/2+wid/24, i*hig/6-hig/2+hig/24, wid-wid/12, hig/12); }
 
  textAlign(RIGHT);  fill(150,180,150);  text("andygiger.com", wid/2-wid/24-10, hig/2-hig/24-10);

  
 for(int i=0; i<nsou; i++) {
	//draw the dark arcs on the circle
    noFill(); stroke(88,44,22); strokeWeight(8); arc(0, 0, rad*2+16, rad*2+16, i*2*PI/nsou-ang, i*2*PI/nsou+PI/nsou-ang); 
	
	//draw the light arcs on the circle
    stroke(80,140,140); arc(0, 0, rad*2+16, rad*2+16, i*2*PI/nsou+PI/nsou-ang, i*2*PI/nsou+2*PI/nsou-ang);

    float sx = sin(ang+i*sep)*rad;
    float sy = cos(ang+i*sep)*rad;
    noStroke(); fill(60, 45, 100);  ellipse(sx, sy, 9, 9);
    if((tra)&&(i==0)&&(next==tpt)) { trnext = 0; }
    if(frameCount%tdrp == 0){
      float vx = prs*(0-sx)/rad - 2*PI*(0-sy)/rot;  
      float vy = prs*(0-sy)/rad + 2*PI*(0-sx)/rot; 
      pt[i*npts + next] = new Pts(sx, sy, vx, vy); 
      if((tra)&&(i==0)&&(next==tpt)) { trnext = 0; }
      if(i==nsou-1) {next += 1;  if(next==npts) {next = 0;}}
    }
  }
  for(int i=0; i<npts*nsou; i++) {
    if(!((tra)&&(i==tpt))) { fill(120, 90, 200);  ellipse(pt[i].x, pt[i].y, 7, 7); }
    else { 
      if(cam) { rotate(-ang); }
      if(trnext>1) { 
        stroke(255, 0, 0, 127);  strokeWeight(3);
        for(int j=0; j<trnext-1; j++) {
          line(tr[j].x, tr[j].y, tr[j+1].x, tr[j+1].y); 
        }
        noStroke();
      }
      if(cam) { rotate(ang); }

	//draw the water dots 
      fill(255, 0, 0);  ellipse(pt[i].x, pt[i].y, 9, 9); 
      if((abs(pt[i].x)>wid)||(abs(pt[i].y)>hig)) { tpt = next;}
      if(!cam) {tr[trnext] = new Pts(pt[i].x, pt[i].y, 0, 0); }
      else {
        float x = pt[i].x*cos(-ang) + pt[i].y*sin(-ang);
        float y = -pt[i].x*sin(-ang) + pt[i].y*cos(-ang);
        tr[trnext] = new Pts(x, y, 0, 0); 
      }
      trnext += 1;
    }
    pt[i].x += pt[i].dx;  pt[i].y += pt[i].dy;  
  }
  ang += dang;
}

void keyPressed() {
if (key == 'a') {            // speed up rotation
    dang -= 0.001;  rot = 2*PI/dang;  //clockwise
  }
  if (key == 'z') {            // slow down rotation
    dang += 0.001;  rot = 2*PI/dang;  //clockwise
  }
  if (key == 's') {            // increase water pressure
    prs += 1;  
  }
  if (key == 'x') {            // decrease water pressure
    if(prs>0) { prs -= 1; }  
  }
  if (key == 'd') {            // increase frame rate
    fra += 1;  
  }
  if (key == 'c') {            // decrease frame rate
    if(fra>1) { fra -= 1; }   
  }
  if (key == 'f') {            // camera rotating with ring
    cam = !cam;  tpt = next; 
  }
  if (key == 't') {            // tracing
    tra = !tra;  tpt = next;
  }
}

class Pts { 
  float x, y, dx, dy; 
  Pts (float ix, float iy, float idx, float idy) {  
    x = ix;  y = iy;  dx = idx;  dy = idy;
  } 
}

