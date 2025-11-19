import { useState } from 'react';
import birdImg from '../../assets/bird.png';

export const birdMessages: Record<string, string[]> = {
  early: [
    '早起的鸟儿有虫吃！',
    '新的一天，新的开始！',
    '清晨最适合学习啦~',
    '太傅：晨读效果加倍哦！',
  ],
  morning: [
    '上午头脑最清醒，冲刺吧！',
    '太傅：别忘了喝水休息~',
    '坚持就是胜利！',
    '知识的积累从现在开始！',
  ],
  afternoon: [
    '下午也要加油哦！',
    '困了就活动一下身体~',
    '太傅：保持专注，效率翻倍！',
    '再坚持一会儿，胜利就在前方！',
  ],
  evening: [
    '晚上适合复盘总结~',
    '太傅：别熬夜，注意休息！',
    '一天的努力值得表扬！',
    '夜深了，早点休息哦~',
  ],
  night: [
    '夜深人静，适合思考人生~',
    '太傅：别忘了明天的计划！',
    '晚安，明天继续加油！',
    '休息好，明天更有精神！',
  ],
  general: [
    '太傅陪你一起进步！',
    '遇到困难别怕，太傅在！',
    '目标明确，行动自会有力量！',
    '每一步都算数，加油！',
    '学习路上不孤单~',
    '太傅：相信自己！',
  ],
};

export function getTimeSegment() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return 'early';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

interface BirdMascotProps {
  position: 'flag' | 'ai' | 'data' | 'contact' | 'mine';
  messages: string[];
}

export default function BirdMascot({ position, messages }: BirdMascotProps) {
  const [birdBubbleVisible, setBirdBubbleVisible] = useState(true);
  const [birdMessageIndex, setBirdMessageIndex] = useState(0);

  const handleBirdClick = () => {
    setBirdBubbleVisible((v) => !v);
    if (!birdBubbleVisible) return;
    setBirdMessageIndex((prev) => {
      let next;
      do {
        next = Math.floor(Math.random() * messages.length);
      } while (next === prev && messages.length > 1);
      return next;
    });
  };

  const containerClass = 
      position === 'flag'
    ? 'absolute left-11 bottom-16 z--1 select-none'
    : position === 'ai'
    ? 'absolute left-[-55px] top-[-60px] z-1 select-none'
    : position === 'data'
    ? 'absolute left-25 -top-5 z-0 select-none'
    : position === 'contact'
    ? 'absolute left-25 -top-6 z-0 select-none'
    : position === 'mine'
    ? 'absolute left-31 top-[-23px] z-0 select-none'
    : 'relative left-1/2 -translate-x-1/2 -mb-8 z-10 select-none';

  return (
    <div
      className={containerClass}
      style={{ pointerEvents: 'auto', width: 160, height: 120 }}
    >
      <div className="relative flex flex-col items-center">
        {birdBubbleVisible && (
          <div
            className="absolute left-27 px-3 py-2 bg-white rounded-2xl shadow-xl text-sm text-black font-semibold whitespace-pre-line min-w-[140px] max-w-[240px] text-center select-none"
            style={{ zIndex: 1 }}
          >
            {messages[birdMessageIndex]}
            <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-6 border-t-transparent border-b-transparent border-r-white" style={{ zIndex: 2 }} />
          </div>
        )}
        <img
          src={birdImg}
          alt="bird"
          className="w-20 h-auto cursor-pointer drop-shadow-lg hover:scale-105 transition-transform"
          style={{ zIndex: 1 }}
          onClick={handleBirdClick}
          draggable={false}
        />
      </div>
    </div>
  );
}