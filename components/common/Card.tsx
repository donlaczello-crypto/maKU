import React from 'react';
import { Icon } from './Icon';
import { useTranslation } from '../../hooks/useTranslation';

interface CardProps {
  title: string;
  description: string;
  iconName: React.ComponentProps<typeof Icon>['name'];
  onClick: () => void;
}

const Card: React.FC<CardProps> = ({ title, description, iconName, onClick }) => {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start space-y-3 border border-slate-100 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer`}
    >
      <div className="bg-sky-100 text-sky-600 p-3 rounded-full">
        <Icon name={iconName} />
      </div>
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default Card;