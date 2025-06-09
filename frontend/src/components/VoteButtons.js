import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/joy';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

function VoteButtons({ initialLikes, initialDislikes, currentUserVote, onVote, disabled = false }) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [voteStatus, setVoteStatus] = useState(currentUserVote); // 0 = none, 1 = liked, -1 = disliked

  useEffect(() => {
    setLikes(initialLikes);
    setDislikes(initialDislikes);
    setVoteStatus(currentUserVote);
  }, [initialLikes, initialDislikes, currentUserVote]);

  const handleVoteClick = (newValue) => {
    if (disabled) return;
    
    const oldStatus = voteStatus;
    let newLikes = likes;
    let newDislikes = dislikes;
    let newStatus = newValue;

    if (oldStatus === newValue) {
      // Отмена голоса
      newStatus = 0;
      newValue === 1 ? newLikes-- : newDislikes--;
    } else {
      // Новый голос или смена голоса
      if (oldStatus === 1) newLikes--;
      if (oldStatus === -1) newDislikes--;
      newValue === 1 ? newLikes++ : newDislikes++;
    }

    // Оптимистичное обновление UI
    setLikes(newLikes);
    setDislikes(newDislikes);
    setVoteStatus(newStatus);
    
    // Вызов функции-обработчика для отправки запроса на API
    onVote(newValue);
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
        {likes - dislikes}
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