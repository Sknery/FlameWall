// frontend/src/components/VoteButtons.js

import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/joy';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

// --- ИЗМЕНЯЕМ ПРОПСЫ: ДОБАВЛЯЕМ initialScore ---
function VoteButtons({ initialScore, initialLikes, initialDislikes, currentUserVote, onVote, disabled = false }) {
  // --- ЛОГИКА ОПРЕДЕЛЕНИЯ НАЧАЛЬНОГО РЕЙТИНГА ---
  const getInitialScore = () => {
    if (initialScore !== undefined) {
      return initialScore;
    }
    if (initialLikes !== undefined && initialDislikes !== undefined) {
      return initialLikes - initialDislikes;
    }
    return 0; // Значение по умолчанию
  };

  const [displayScore, setDisplayScore] = useState(getInitialScore());
  const [voteStatus, setVoteStatus] = useState(currentUserVote || 0);

  // Синхронизируем состояние, если пропсы изменятся
  useEffect(() => {
    setDisplayScore(getInitialScore());
    setVoteStatus(currentUserVote || 0);
  }, [initialScore, initialLikes, initialDislikes, currentUserVote]);

  const handleVoteClick = (newValue) => {
    if (disabled) return;

    const oldStatus = voteStatus;
    let newDisplayScore = displayScore;

    // Отменяем текущий голос (например, был лайк, нажали лайк еще раз)
    if (oldStatus === newValue) {
      newValue === 1 ? newDisplayScore-- : newDisplayScore++;
      setVoteStatus(0);
    } else {
      // Смена голоса (с лайка на дизлайк)
      if (oldStatus === 1) newDisplayScore--;
      if (oldStatus === -1) newDisplayScore++;
      // Добавление нового голоса
      newValue === 1 ? newDisplayScore++ : newDisplayScore--;
      setVoteStatus(newValue);
    }
    
    setDisplayScore(newDisplayScore);
    onVote(newValue); // Отправляем запрос на API
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title="Like" variant="outlined" size="sm">
        <IconButton
          variant={voteStatus === 1 ? 'solid' : 'soft'}
          color={voteStatus === 1 ? 'success' : 'neutral'}
          onClick={() => handleVoteClick(1)}
          disabled={disabled}
        >
          <ThumbUpIcon />
        </IconButton>
      </Tooltip>
      <Typography fontWeight="md" sx={{ minWidth: '20px', textAlign: 'center' }}>
        {/* --- ОТОБРАЖАЕМ НОВОЕ СОСТОЯНИЕ --- */}
        {displayScore}
      </Typography>
      <Tooltip title="Dislike" variant="outlined" size="sm">
        <IconButton
          variant={voteStatus === -1 ? 'solid' : 'soft'}
          color={voteStatus === -1 ? 'danger' : 'neutral'}
          onClick={() => handleVoteClick(-1)}
          disabled={disabled}
        >
          <ThumbDownIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default VoteButtons;