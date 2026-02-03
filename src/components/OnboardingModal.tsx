import { useState } from 'react';
import { ChevronRight, Check, Trophy, Zap, Gamepad2 } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
  playSfx: (type: any) => void;
}

const STEPS = [
  {
    title: "Добро пожаловать!",
    desc: "Словодел — это битва эрудитов. Составляйте слова из букв, набирайте очки и соревнуйтесь с другими игроками.",
    icon: <Gamepad2 size={64} className="text-indigo-500" />,
    color: "text-indigo-600"
  },
  {
    title: "Используйте Бонусы",
    desc: "В трудной ситуации помогут бонусы: дополнительное Время, Подсказка слова, Джокер или Замена букв.",
    icon: <Zap size={64} className="text-amber-500" />,
    color: "text-amber-600"
  },
  {
    title: "Турниры и Ранги",
    desc: "Участвуйте в Ежедневных испытаниях, занимайте призовые места и получайте уникальные звания и награды!",
    icon: <Trophy size={64} className="text-pink-500" />,
    color: "text-pink-600"
  }
];

export const OnboardingModal = ({ onClose, playSfx }: OnboardingModalProps) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    playSfx('click');
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onClose();
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="modal-overlay z-[400] backdrop-blur-md bg-black/60">
      <div className="modal-content max-w-sm w-full p-6 text-center flex flex-col items-center animate-scale-in">
        
        {/* Индикатор шагов */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? `w-8 ${currentStep.color.replace('text-', 'bg-')}` : 'w-2 bg-gray-200 dark:bg-white/20'}`}
            />
          ))}
        </div>

        {/* Иконка */}
        <div className="mb-6 p-6 rounded-3xl bg-gray-50 dark:bg-white/5 animate-bounce-slow">
          {currentStep.icon}
        </div>

        {/* Текст */}
        <h2 className="text-2xl font-black mb-3 text-gray-900 dark:text-white leading-tight">
          {currentStep.title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8 px-2">
          {currentStep.desc}
        </p>

        {/* Кнопка */}
        <button 
          onClick={handleNext}
          className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {step === STEPS.length - 1 ? (
            <>Начать игру <Check size={20} strokeWidth={3} /></>
          ) : (
            <>Далее <ChevronRight size={20} strokeWidth={3} /></>
          )}
        </button>

      </div>
    </div>
  );
};
