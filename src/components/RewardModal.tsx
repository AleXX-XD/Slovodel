import { Gift, Hourglass, Lightbulb, RefreshCw, SquareAsterisk, Trophy } from 'lucide-react';

type RewardItem = { type: string; amount: number };

interface RewardModalProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
  achievement: string;
  reward: RewardItem | { type: 'bundle'; items: RewardItem[] };
}

const rewardIcons: Record<string, React.ReactNode> = {
  time: <Hourglass size={24} className="text-indigo-500" />,
  hint: <Lightbulb size={24} className="text-amber-500" />,
  swap: <RefreshCw size={24} className="text-pink-500" />,
  wildcard: <SquareAsterisk size={24} className="text-purple-500" />,
  daily_bundle: <Trophy size={64} className="text-amber-500 animate-bounce" />,
};

const rewardNames: Record<string, string> = {
  time: 'Время',
  hint: 'Подсказка',
  swap: 'Замена',
  wildcard: 'Джокер',
  daily_bundle: 'Набор бонусов',
};

export const RewardModal = ({ onClose, playSfx, achievement, reward }: RewardModalProps) => {
  const isDailyBundle = reward.type === 'daily_bundle';
  const isCustomBundle = reward.type === 'bundle';

  return (
    <div className="modal-overlay !z-[9999] animate-in fade-in duration-300">
      <div className="reward-modal-content">
        <div className="reward-gradient-bar"></div>
        {isDailyBundle ? (
             <Trophy size={64} className="mx-auto mb-4 text-amber-500 animate-bounce" />
        ) : (
             <Gift size={64} className="reward-icon" />
        )}
        
        <h2 className="reward-title">{isDailyBundle ? "ПОБЕДА!" : "Награда!"}</h2>
        <p className="reward-subtitle">{achievement}</p>

        <div className="reward-box">
          <p className="reward-box-label">Ваш приз:</p>
          {isDailyBundle ? (
            <div className="flex flex-col gap-1 items-center">
                 <p className="font-bold text-lg text-indigo-700">Всё по +{(reward as RewardItem).amount}</p>
                 <div className="flex gap-2 mt-2">
                    <Hourglass size={20} className="text-indigo-500" />
                    <Lightbulb size={20} className="text-amber-500" />
                    <RefreshCw size={20} className="text-pink-500" />
                    <SquareAsterisk size={20} className="text-purple-500" />
                 </div>
            </div>
          ) : isCustomBundle ? (
            <div className="flex flex-wrap gap-2 w-full px-4 justify-center">
              {(reward as { type: 'bundle'; items: RewardItem[] }).items.map(item => (
                <div key={item.type} className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg justify-center min-w-[120px] flex-1">
                  {rewardIcons[item.type]}
                  <span className="font-bold text-indigo-700 dark:text-indigo-200">+{item.amount}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
                {rewardIcons[(reward as RewardItem).type]}
                <p className="reward-box-value">
                    {rewardNames[(reward as RewardItem).type]} +{(reward as RewardItem).amount}
                </p>
            </>
          )}
        </div>

        <button 
          onClick={() => { playSfx('click'); onClose(); }}
          className="reward-button"
        >
          Забрать
        </button>
      </div>
    </div>
  );
};