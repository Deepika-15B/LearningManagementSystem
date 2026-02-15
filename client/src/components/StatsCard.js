import React from 'react';
import { FiTrendingUp, FiUsers, FiBook, FiAward } from 'react-icons/fi';
import './StatsCard.css';

const StatsCard = ({ title, value, icon, gradient, trend, trendValue }) => {
  const IconComponent = icon || FiTrendingUp;
  
  return (
    <div className={`stats-card ${gradient || 'gradient-card-blue'} fade-in`}>
      <div className="stats-icon">
        <IconComponent size={32} />
      </div>
      <div className="stats-content">
        <h3 className="stats-title">{title}</h3>
        <div className="stats-value">{value}</div>
        {trend && (
          <div className={`stats-trend ${trend}`}>
            <FiTrendingUp size={14} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;

