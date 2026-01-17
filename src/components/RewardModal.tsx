import { Gift, Hourglass, Lightbulb, RefreshCw, SquareAsterisk } from 'lucide-react';

interface RewardModalProps {
  onClose: () => void;
  playSfx: (sound: any) => void;
  achievement: string;
  reward: { type: string; amount: number };
}

const rewardIcons: Record<string, React.ReactNode> = {
  time: <Hourglass size={48} className="text-indigo-500" />,
  hint: <Lightbulb size={48} className="text-amber-500" />,
  swap: <RefreshCw size={48} className="text-pink-500" />,
  wildcard: <SquareAsterisk size={48} className="text-purple-500" />,
};

const rewardNames: Record<string, string> = {
  time: 'Время',
  hint: 'Подсказка',
  swap: 'Замена',
  wildcard: 'Джокер',
};

export const RewardModal = ({ onClose, playSfx, achievement, reward }: RewardModalProps) => {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center dark:bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
      <div className="reward-modal-content">
        <div className="reward-gradient-bar"></div>
        <Gift size={64} className="reward-icon" />
        
        <h2 className="reward-title">Награда!</h2>
        <p className="reward-subtitle">{achievement}</p>

        <div className="reward-box">
          <p className="reward-box-label">Ваш приз:</p>
          {rewardIcons[reward.type]}
          <p className="reward-box-value">
            {rewardNames[reward.type]} +{reward.amount}
          </p>
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