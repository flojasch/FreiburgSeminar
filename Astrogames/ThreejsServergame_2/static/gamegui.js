export const gamegui = (function () {
  
  class GameGui {
    constructor() {
      const guiDiv = document.createElement('div');
      guiDiv.className = 'guiRoot guiBox';
  
      const scoreDiv = document.createElement('div');
      scoreDiv.className = 'vertical';
  
      const scoreTitle = document.createElement('div');
      scoreTitle.className = 'guiBigText';
      scoreTitle.innerText = 'SCORE';
  
      const scoreText = document.createElement('div');
      scoreText.className = 'guiSmallText';
      scoreText.innerText = '0';
      scoreText.id = 'scoreText';

      const speedTitle = document.createElement('div');
      speedTitle.className = 'guiBigText';
      speedTitle.innerText = 'SPEED';
  
      const speedText = document.createElement('div');
      speedText.className = 'guiSmallText';
      speedText.innerText = '0';
      speedText.id = 'speedText';
  
      const healthTitle = document.createElement('div');
      healthTitle.className = 'guiBigText';
      healthTitle.innerText = 'HEALTH';
  
      const healthText = document.createElement('div');
      healthText.className = 'guiSmallText';
      healthText.innerText = '2';
      healthText.id = 'healthText';
  
      scoreDiv.appendChild(scoreTitle);
      scoreDiv.appendChild(scoreText);
      scoreDiv.appendChild(speedTitle);
      scoreDiv.appendChild(speedText);
      scoreDiv.appendChild(healthTitle);
      scoreDiv.appendChild(healthText);
      

      guiDiv.appendChild(scoreDiv);
      document.body.appendChild(guiDiv);
  
    }
    Update(player) {
      document.getElementById('scoreText').innerText = player.score;
      document.getElementById('speedText').innerText = Math.floor(player.speed*100)/100;
      document.getElementById('healthText').innerText = player.lives;
      if (player.lives <= 0) {
        const gameOver = document.createElement('div');
        gameOver.className = 'veryBigText';
        gameOver.innerText = 'GAME OVER';
        document.body.appendChild(gameOver);
      }
    }
  }
  
  return {
    GameGui:GameGui,
};
})();