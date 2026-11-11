"""Check planned shot coverage, text reading time and causal event order.
Standard library only. Does not inspect rendered pixels, audio or aesthetics.
"""
import argparse,json,math,re,sys
from pathlib import Path

def check(plan,cjk_cps=4.5,latin_cps=15):
    errors=[]
    def number(v):return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v)
    duration=plan.get('duration');fps=plan.get('fps')
    if not number(duration) or duration<=0 or not number(fps) or fps<=0:
        return {'passed':False,'errors':['duration/fps must be positive finite numbers'],'scope':'plan only'}
    for group in ['shots','texts','events']:
        if not isinstance(plan.get(group),list):errors.append(f'{group} must be an explicit array')
    if errors:return {'passed':False,'errors':errors,'scope':'plan only'}
    for group in ['shots','texts','events']:
        seen=set()
        for i,row in enumerate(plan[group]):
            if not isinstance(row,dict):errors.append(f'{group}[{i}] must be an object');continue
            rid=row.get('id')
            if not isinstance(rid,str) or not rid or rid in seen:errors.append(f'{group}[{i}] missing/duplicate id')
            else:seen.add(rid)
    if errors:return {'passed':False,'errors':errors,'scope':'plan only'}
    intervals=[]
    for group in ['shots','texts']:
        for row in plan[group]:
            a,b=row.get('t0'),row.get('t1');rid=row['id']
            if not number(a) or not number(b) or not 0<=a<b<=duration:
                errors.append(f'{group}/{rid}: invalid interval');continue
            if group=='shots':intervals.append(row)
    tol=1e-6;end=0
    if not intervals:errors.append('shots: no valid shots')
    for row in sorted(intervals,key=lambda r:r['t0']):
        if row['t0']>end+tol:errors.append(f"shots: gap before {row['id']}")
        if row['t0']<end-tol and row.get('transition_in') is not True:errors.append(f"shots: undeclared overlap at {row['id']}")
        end=max(end,row['t1'])
    if end<duration-tol:errors.append('shots: uncovered tail')
    reading=[]
    for row in plan['texts']:
        if not all(number(row.get(k)) for k in ['t0','t1']):continue
        text=row.get('text');role=row.get('role');full=row.get('fully_visible_t0',row['t0'])
        if not isinstance(text,str) or not text.strip() or role not in ['title','body','label','micro'] or not number(full) or not row['t0']<=full<row['t1']:
            errors.append(f"texts/{row['id']}: invalid text, role or fully_visible_t0");continue
        chars=[c for c in text if not c.isspace()]
        cjk=sum(bool(re.match(r'[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]',c)) for c in chars)
        need=cjk/cjk_cps+(len(chars)-cjk)/latin_cps+(.25 if role in ['label','micro'] else .5)
        actual=row['t1']-full;ok=actual+tol>=need
        reading.append({'id':row['id'],'need_s':round(need,3),'available_s':round(actual,3),'passed':ok})
        if not ok:errors.append(f"texts/{row['id']}: reading time {actual:.2f}s < {need:.2f}s")
    ev={r['id']:r for r in plan['events']}
    graph={}
    for rid,row in ev.items():
        t=row.get('t');deps=row.get('requires',[])
        if not number(t) or not 0<=t<duration:errors.append(f'events/{rid}: invalid time')
        if not isinstance(deps,list) or not all(isinstance(d,str) for d in deps):errors.append(f'events/{rid}: invalid requires');deps=[]
        graph[rid]=deps
        for dep in deps:
            if dep not in ev:errors.append(f'events/{rid}: missing dependency {dep}')
            elif number(t) and number(ev[dep].get('t')) and ev[dep]['t']>t+tol:errors.append(f'events/{rid}: occurs before {dep}')
    visiting=set();done=set()
    def visit(rid):
        if rid in visiting:errors.append(f'events: dependency cycle at {rid}');return
        if rid in done:return
        visiting.add(rid)
        for dep in graph.get(rid,[]):
            if dep in graph:visit(dep)
        visiting.remove(rid);done.add(rid)
    for rid in graph:visit(rid)
    return {'passed':not errors,'errors':errors,'reading':reading,'scope':'plan only; rendered pixels, media quality, style and audio not checked'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('plan',type=Path);p.add_argument('--out',type=Path);p.add_argument('--cjk-cps',type=float,default=4.5);p.add_argument('--latin-cps',type=float,default=15);a=p.parse_args()
    try:
        if not all(math.isfinite(v) and v>0 for v in [a.cjk_cps,a.latin_cps]):raise ValueError('reading rates must be positive finite')
        plan=json.loads(a.plan.read_text(encoding='utf-8-sig'))
        if not isinstance(plan,dict):raise ValueError('plan must be an object')
        result=check(plan,a.cjk_cps,a.latin_cps);s=json.dumps(result,ensure_ascii=False,indent=2)
        if a.out:a.out.write_text(s,encoding='utf-8')
        print(s);return 0 if result['passed'] else 1
    except (ValueError,OSError,TypeError) as e:print(f'NOT CHECKED: {e}',file=sys.stderr);return 2
if __name__=='__main__':sys.exit(main())
