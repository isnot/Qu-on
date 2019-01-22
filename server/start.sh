#!/bin/bash

export mandala_sacsid=
export mandala_csrf_token=
export mandala_bot_api_key=356700597:AAFnFWG73Y5wl4ApUVwOz2lqKzdzyFPmicE
export mandala_chat_id=-1001216130885
#export mandala_chat_id=-1001119217627
export mandala_capture_area=mandala/iitc/35.74753,139.600332/z15/0
# s1119217627
# 120 min = 7 200 000 milsec
export mandala_process_interval_milsec=3600000
export mandala_max_count=25
export mandala_viewport_width=2665
export mandala_viewport_height=726
export mandala_l=isnotjp@hotmail.com
export mandala_p=gnaoto123


export NODE_PATH=/usr/local/lib/node_modules

mkdir -p /tmp/mandala-screenshots
cd /home/naoto/repository/mandala-system/iitc

pkill -f "(chromium)*?(--headless)"

#node ./index.js

pkill -f "(chromium)*?(--headless)"
