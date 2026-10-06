#!/bin/bash
set -euo pipefail
out="public/backgrounds"
mkdir -p "$out"

make_clip() {
  local name="$1"
  local red="$2"
  local green="$3"
  local blue="$4"
  local fwd="$out/.fwd-${name}.mp4"
  local rev="$out/.rev-${name}.mp4"
  ffmpeg -y -f lavfi -i "color=c=black:s=540x960:d=2:r=24,format=rgb24,geq=r='${red}':g='${green}':b='${blue}'" \
    -c:v libx264 -pix_fmt yuv420p -crf 16 -preset veryfast -an "$fwd"
  ffmpeg -y -i "$fwd" -vf "reverse,trim=start_frame=1,setpts=PTS-STARTPTS" \
    -c:v libx264 -pix_fmt yuv420p -crf 16 -preset veryfast -an "$rev"
  ffmpeg -y -i "$fwd" -i "$rev" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0" \
    -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium -movflags +faststart -an "$out/${name}.mp4"
  ffmpeg -y -ss 0.5 -i "$out/${name}.mp4" -frames:v 1 -update 1 "$out/${name}.jpg"
  rm -f "$fwd" "$rev"
}

# A lamp moving through a dark room.
make_clip noor \
  '20+150*exp(-pow((X-W*(0.48+0.14*sin(PI*T)))/(W*0.32),2)-pow((Y-H*(0.4+0.1*cos(PI*T)))/(H*0.26),2))+10' \
  '12+68*exp(-pow((X-W*(0.48+0.14*sin(PI*T)))/(W*0.32),2)-pow((Y-H*(0.4+0.1*cos(PI*T)))/(H*0.26),2))+4' \
  '8+18*exp(-pow((X-W*0.5)/(W*0.6),2)-pow((Y-H*0.45)/(H*0.5),2))'

# Dawn wash, light enough for dark type.
make_clip fajr \
  '214+28*exp(-pow((X-W*0.5)/(W*0.7),2)-pow((Y-H*(0.32+0.1*sin(PI*T)))/(H*0.42),2))+10*sin(PI*T)' \
  '186+22*exp(-pow((X-W*(0.4+0.08*cos(PI*T)))/(W*0.6),2)-pow((Y-H*0.55)/(H*0.5),2))' \
  '168+18*sin(PI*(T+Y/H))'

# Slow water light.
make_clip bahr \
  '8+34*(0.5+0.5*sin(X/24+PI*T)*sin(Y/32-2*PI*T))' \
  '28+86*(0.5+0.5*sin(X/24+PI*T)*sin(Y/30-2*PI*T))' \
  '36+64*(0.5+0.5*sin((X+Y)/42+PI*T))'

# A moon drifting on a deep night.
make_clip layl \
  '8+78*exp(-pow((X-W*(0.66+0.06*sin(PI*T)))/(W*0.18),2)-pow((Y-H*0.22)/(H*0.13),2))+6' \
  '14+88*exp(-pow((X-W*(0.66+0.06*sin(PI*T)))/(W*0.18),2)-pow((Y-H*0.22)/(H*0.13),2))+8' \
  '28+120*exp(-pow((X-W*(0.66+0.06*sin(PI*T)))/(W*0.2),2)-pow((Y-H*0.22)/(H*0.15),2))+16+10*sin(PI*Y/H)'

# A gold stroke crossing ink.
make_clip hibr \
  '16+36*exp(-pow((X-W*0.5)/(W*0.8),2)-pow((Y-H*0.5)/(H*0.8),2))+175*exp(-pow((X-W*(0.5+0.24*sin(PI*T)))/(W*0.03),2))' \
  '12+22*exp(-pow((X-W*0.5)/(W*0.8),2)-pow((Y-H*0.5)/(H*0.8),2))+130*exp(-pow((X-W*(0.5+0.24*sin(PI*T)))/(W*0.03),2))' \
  '8+10*exp(-pow((X-W*0.5)/(W*0.8),2)-pow((Y-H*0.5)/(H*0.8),2))+28*exp(-pow((X-W*(0.5+0.24*sin(PI*T)))/(W*0.03),2))'

echo "done"
ls -lh "$out"
