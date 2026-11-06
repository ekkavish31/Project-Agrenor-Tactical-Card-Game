from pathlib import Path
import base64,json
root=Path(__file__).resolve().parents[1]
art={p.stem:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode() for p in (root/'assets/intro/story').glob('*.png')}
art['../studies/painted-tunnel']='data:image/png;base64,'+base64.b64encode((root/'assets/intro/studies/painted-tunnel.png').read_bytes()).decode()
script=(root/'js/game-intro.js').read_text();script=script.replace("(()=>{'use strict';let active=false;", "(()=>{'use strict';const art="+json.dumps(art)+";let active=false;")
script=script.replace("assets/intro/story/${name}.png",'${art[name]}').replace("'assets/intro/story/'+n+'.png'",'art[n]')
css=(root/'css/game-intro.css').read_text()
import re
css=re.sub(r"url\('\.\./(assets/[^']+)'\)",lambda m:"url('data:image/png;base64,"+base64.b64encode((root/m[1]).read_bytes()).decode()+"')",css)
html='''<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Agrenor · Full Intro Preview</title><style>body{margin:0;background:#111;color:#f2d9a2;font:16px system-ui}#preview{position:fixed;inset:0;background:center/cover no-repeat}main{position:absolute;inset:0;display:grid;place-content:center;text-align:center;background:#0008}h1{font:64px Georgia}button{padding:12px 24px;font:inherit;cursor:pointer}.ts-main{z-index:1}</style><style>'''+css+'''</style><div id="preview"><main class="ts-main"><h1>AGRENOR</h1><p>ต้นแบบอินโทร · บ้านและเส้นทางชีวิต</p><button data-act="new" onclick="GameIntro.play(document.getElementById('preview'))">ดู Intro อีกครั้ง</button><p style="max-width:550px;font-size:13px">ภาพวาดประกอบกับการเคลื่อนกล้องและกรอบภาพ · ช่วงส่งของและประตูใช้การเฟดเปลี่ยนท่าภาพวาด ตัวละครยังไม่ได้ขยับแขนขาแยกชั้น</p></main></div><script>'''+script+'''\nGameIntro.play(document.getElementById('preview'));</script></html>'''
(root/'dev/agrenor-full-intro.html').write_text(html)
print('Standalone HTML:',len(html),'bytes')
