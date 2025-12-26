import { PopoverContent } from '../ui/popover';
import { Progress } from '../ui/progress';
import { FLAG_LABELS, FLAG_PRIORITIES } from '../../lib/constants/constants';
import type { Task } from '../../lib/types/types';

interface FlagDetailCardProps {
  task: Task;
  isCompleted?: boolean;
  getFlagDateStatus: (flag: Task) => string;
}

/**
 * Flag详情卡片组件
 * 用于显示flag的完整详细信息，包括进度、优先级、类型、分享状态、提醒等
 */
export const FlagDetailCard = ({ task, isCompleted = false, getFlagDateStatus }: FlagDetailCardProps) => (
  <PopoverContent className="w-80 bg-white/95 backdrop-blur-sm border-white/20 shadow-xl rounded-xl">
    <div className="space-y-3">
      <div>
        <h4 className="font-semibold text-base mb-1">{task.title}</h4>
        <div className="text-xs text-gray-500 mb-2">
          {getFlagDateStatus(task)}
        </div>
        {task.detail && (
          <p className="text-sm text-muted-foreground">{task.detail}</p>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">进度</span>
            <span className={`font-medium ${isCompleted ? 'text-green-700' : ''}`}>
              {task.count}/{task.total} 次
            </span>
          </div>
          <Progress 
            value={(task.count || 0) / (task.total || 1) * 100}
            indicatorColor={isCompleted ? "#059669" : "#2563eb"}
            className="h-2"
          />
        </div>
        
        {task.priority && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">优先级</span>
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
              task.priority === 1 ? 'bg-red-100 text-red-700' : 
              task.priority === 2 ? 'bg-orange-100 text-orange-700' :
              task.priority === 3 ? 'bg-yellow-100 text-yellow-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {FLAG_PRIORITIES[task.priority]}
            </span>
          </div>
        )}
        
        {task.label && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">类型</span>
            <span 
              className="inline-block px-2 py-0.5 text-xs font-medium rounded"
              style={{ 
                backgroundColor: `${FLAG_LABELS[task.label].color}20`,
                color: FLAG_LABELS[task.label].color
              }}
            >
              {FLAG_LABELS[task.label].name}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">分享状态</span>
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
            task.postId 
              ? 'bg-purple-100 text-purple-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {task.postId ? '已分享' : '未分享'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">消息提醒</span>
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
            task.enableNotification
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {task.enableNotification ? `已开启 (${task.reminderTime || '12:00'})` : '未开启'}
          </span>
        </div>
        
        {isCompleted && task.completedAt && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">完成时间</span>
            <span className="text-xs text-green-700 font-medium">
              {new Date(task.completedAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        )}
        
        {task.createdAt && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">创建时间</span>
            <span className="text-xs">{new Date(task.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
        )}
      </div>
    </div>
  </PopoverContent>
);
