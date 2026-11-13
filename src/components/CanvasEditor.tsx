import {useCallback,useEffect,useRef,useState} from 'react';
import {Stage,Layer,Rect,Text as KText,Ellipse,Line as KLine,Path as KPath,Image as KImage,Transformer} from 'react-konva';
import Konva from 'konva';
import type {DesignElement, ImageElement, TextElement} from '../lib/schema';
import {useStudio} from '../store/useStudio';
import {downloadUrl, slug} from '../lib/file';

type Props={exportRef:React.MutableRefObject<((mime?:'image/png'|'image/webp')=>void)|null>, zoom:number};
function useLoaded(src:string){const [image,setImage]=useState<HTMLImageElement|null>(null);useEffect(()=>{
 let mounted=true;const img=new window.Image();img.onload=()=>{if(mounted)setImage(img)};img.onerror=()=>{if(mounted)setImage(null)};img.src=src;
 return()=>{mounted=false};
},[src]);return image;}
function ImageNode({element,common,register}:{element:ImageElement,common:Record<string,unknown>,register:(node:Konva.Node|null)=>void}){
 const img=useLoaded(element.src);return <KImage ref={register} {...common} image={img||undefined} width={element.width} height={element.height}/>;
}
function regularPoints(width:number,height:number,sides:number,innerRatio?:number):number[]{
 const points:number[]=[];const n=innerRatio?sides*2:sides;
 for(let i=0;i<n;i++){
  const angle=-Math.PI/2+(Math.PI*2*i/n);
  const ratio=innerRatio&&i%2===1?innerRatio:1;
  points.push(width/2+Math.cos(angle)*width*.49*ratio,height/2+Math.sin(angle)*height*.49*ratio);
 }
 return points;
}
function textFontSize(el:TextElement){
 // Heuristic shrink: maintain a generous text box to avoid clipping at common sizes.
 const approxCharWidth=.53;let size=el.fontSize;
 for(let i=0;i<50;i++){
  const rows=el.content.split('\n').reduce((sum,line)=>sum+Math.max(1,Math.ceil(line.length*size*approxCharWidth/Math.max(el.width,1))),0);
  if(rows*size*1.16<=el.height||size<=28)break;
  size-=1;
 }
 return size;
}
export function CanvasEditor({exportRef,zoom}:Props){
 const {design,selectedId,select,patchElement}=useStudio();
 const host=useRef<HTMLDivElement>(null);const stage=useRef<Konva.Stage>(null);const transformer=useRef<Konva.Transformer>(null);
 const nodes=useRef<Record<string,Konva.Node|null>>({});
 const [dimensions,setDimensions]=useState({width:800,height:760});
 useEffect(()=>{
  if(typeof document==='undefined'||!document.fonts)return;
  let active=true;
  void document.fonts.ready.then(()=>{if(active)stage.current?.getLayers().forEach(layer=>layer.batchDraw())});
  return()=>{active=false};
 },[]);
 useEffect(()=>{
  if(!host.current)return;const obs=new ResizeObserver(entries=>{
   const d=entries[0]?.contentRect;if(d)setDimensions({width:d.width,height:d.height});
  });obs.observe(host.current);return()=>obs.disconnect();
 },[]);
 const fit=Math.min((dimensions.width-70)/design.canvas.width,(dimensions.height-75)/design.canvas.height,0.83);
 const scale=Math.max(0.10,fit*(zoom/100));
 useEffect(()=>{const tr=transformer.current;const node=selectedId?nodes.current[selectedId]:null;if(!tr)return;tr.nodes(node?[node]:[]);tr.getLayer()?.batchDraw()},[selectedId,design.elements]);
 const exportImage=useCallback((mime:'image/png'|'image/webp'='image/png')=>{
  if(!stage.current) return;
  const tr=transformer.current;const old=tr?.visible();tr?.visible(false);stage.current.draw();
  try{
   const url=stage.current.toDataURL({pixelRatio:1/scale,mimeType:mime,quality:0.94});
   downloadUrl(url,`${slug(design.title)}.${mime==='image/png'?'png':'webp'}`);
  }finally{tr?.visible(old??true);stage.current.draw()}
 },[design.title,scale]);
 useEffect(()=>{exportRef.current=exportImage;return()=>{exportRef.current=null}},[exportImage,exportRef]);
 const renderElement=(el:DesignElement)=>{
  const register=(node:Konva.Node|null)=>{nodes.current[el.id]=node};
  const common={id:el.id,x:el.x,y:el.y,rotation:el.rotation,opacity:el.opacity,draggable:true,
    onClick:(event:Konva.KonvaEventObject<MouseEvent>)=>{event.cancelBubble=true;select(el.id)},
    onTap:(event:Konva.KonvaEventObject<TouchEvent>)=>{event.cancelBubble=true;select(el.id)},
    onDragEnd:(ev:Konva.KonvaEventObject<DragEvent>)=>{
      const node=ev.target;
      patchElement(el.id,el.type==='ellipse'?{x:Math.round(node.x()-el.width/2),y:Math.round(node.y()-el.height/2)}:{x:Math.round(node.x()),y:Math.round(node.y())});
    },
    onTransformEnd:(ev:Konva.KonvaEventObject<Event>)=>{
      const n=ev.target;const sx=n.scaleX(),sy=n.scaleY();n.scaleX(1);n.scaleY(1);
      const w=Math.max(20,Math.round(el.width*sx)),h=Math.max(20,Math.round(el.height*sy));
      patchElement(el.id,{x:Math.round(el.type==='ellipse'?n.x()-w/2:n.x()),y:Math.round(el.type==='ellipse'?n.y()-h/2:n.y()),width:w,height:h,rotation:Math.round(n.rotation())});
    }
  };
  if(el.type==='text')return <KText key={el.id} ref={register} {...common} width={el.width} height={el.height} text={el.content} fontSize={textFontSize(el)} fontFamily={el.fontFamily==='Inter'?'Inter, Arial, sans-serif':el.fontFamily} fontStyle={el.fontWeight} fill={el.color} align={el.align} verticalAlign="middle" lineHeight={1.16} wrap="word" ellipsis={true}/>;
  if(el.type==='rect')return <Rect key={el.id} ref={register} {...common} width={el.width} height={el.height} fill={el.fill} cornerRadius={el.radius} stroke={el.stroke} strokeWidth={el.strokeWidth} {...(el.fillEnd?{fillLinearGradientStartPoint:{x:0,y:0},fillLinearGradientEndPoint:{x:el.width,y:el.height},fillLinearGradientColorStops:[0,el.fill,1,el.fillEnd]}:{})}/>;
  if(el.type==='ellipse')return <Ellipse key={el.id} ref={register} {...common} x={el.x+el.width/2} y={el.y+el.height/2} radiusX={el.width/2} radiusY={el.height/2} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} {...(el.fillEnd?{fillLinearGradientStartPoint:{x:-el.width/2,y:-el.height/2},fillLinearGradientEndPoint:{x:el.width/2,y:el.height/2},fillLinearGradientColorStops:[0,el.fill,1,el.fillEnd]}:{})}/>;
  if(el.type==='polygon')return <KLine key={el.id} ref={register} {...common} points={regularPoints(el.width,el.height,el.sides)} closed fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} lineJoin="round"/>;
  if(el.type==='star')return <KLine key={el.id} ref={register} {...common} points={regularPoints(el.width,el.height,el.points,el.innerRatio)} closed fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} lineJoin="round"/>;
  if(el.type==='line')return <KLine key={el.id} ref={register} {...common} points={[0,0,el.width,el.height]} stroke={el.fill} strokeWidth={el.strokeWidth} lineCap="round" lineJoin="round"/>;
  if(el.type==='path')return <KPath key={el.id} ref={register} {...common} data={el.data} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} listening/>;
  return <ImageNode key={el.id} element={el} common={common} register={register}/>;
 };
 return <div className="canvas-host" ref={host}>
  <div className="artboard-shell" style={{width:design.canvas.width*scale,height:design.canvas.height*scale}}>
   <Stage ref={stage} width={design.canvas.width*scale} height={design.canvas.height*scale} onMouseDown={(e)=>{if(e.target===e.target.getStage()||e.target.name()==='background')select(null)}} onTouchStart={(e)=>{if(e.target===e.target.getStage()||e.target.name()==='background')select(null)}}>
    <Layer scaleX={scale} scaleY={scale}>
      <Rect name="background" x={0} y={0} width={design.canvas.width} height={design.canvas.height} fill={design.canvas.background} {...(design.canvas.backgroundEnd?{fillLinearGradientStartPoint:{x:0,y:0},fillLinearGradientEndPoint:{x:design.canvas.width,y:design.canvas.height},fillLinearGradientColorStops:[0,design.canvas.background,1,design.canvas.backgroundEnd]}:{})}/>
      {design.elements.map(renderElement)}
      <Transformer ref={transformer} flipEnabled={false} keepRatio={false} rotateEnabled={true} borderStroke="#8BEACE" anchorFill="#FFFFFF" anchorStroke="#0B8673" anchorSize={11} anchorCornerRadius={3} borderDash={[7,4]} boundBoxFunc={(_,next)=>next.width<20||next.height<20?_:next}/>
    </Layer>
   </Stage>
  </div>
  <div className="canvas-caption"><span className="canvas-dot"/> Canvas · {design.canvas.width} × {design.canvas.height}px <span className="caption-sep">•</span> Selecione e arraste os elementos</div>
 </div>;
}
