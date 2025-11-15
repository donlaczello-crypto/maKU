
import React from 'react';
import Icon from './Icon';

interface CardProps {
  title: string;
  description: string;
  iconName: React.ComponentProps<typeof Icon>['name'];
  onClick: () => void;
}

const Card: React.FC<CardProps> = ({ title, description, iconName, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start space-y-3 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-100"
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