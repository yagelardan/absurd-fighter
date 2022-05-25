const mapData = {
  minX: 1,
  maxX: 14,
  minY: 4,
  maxY: 12,
  blockedSpaces: {
    "7x4": true,
    "1x11": true,
    "12x10": true,
    "4x7": true,
    "5x7": true,
    "6x7": true,
    "8x6": true,
    "9x6": true,
    "10x6": true,
    "7x9": true,
    "8x9": true,
    "9x9": true,
  },
};

// Options for Player Colors... these are in the same order as our sprite sheet
const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

//Misc Helpers
function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function getKeyString(x, y) {
  return `${x}x${y}`;
}


function createName() {
  const prefix = randomFromArray([
    "COOL",
    "SUPER",
    "HIP",
    "SMUG",
    "COOL",
    "SILKY",
    "GOOD",
    "SAFE",
    "DEAR",
    "DAMP",
    "WARM",
    "RICH",
    "LONG",
    "DARK",
    "SOFT",
    "BUFF",
    "DOPE",
  ]);
  const animal = randomFromArray([
    "BEAR",
    "DOG",
    "CAT",
    "FOX",
    "LAMB",
    "LION",
    "BOAR",
    "GOAT",
    "VOLE",
    "SEAL",
    "PUMA",
    "MULE",
    "BULL",
    "BIRD",
    "BUG",
  ]);
  return `${prefix} ${animal}`;
}

function isSolid(x,y) {

  const blockedNextSpace = mapData.blockedSpaces[getKeyString(x, y)];
  return (
    blockedNextSpace ||
    x >= mapData.maxX ||
    x < mapData.minX ||
    y >= mapData.maxY ||
    y < mapData.minY
  )
}

function getRandomSafeSpot() {
  //We don't look things up by key here, so just return an x/y
  return randomFromArray([
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 1, y: 5 },
    { x: 2, y: 6 },
    { x: 2, y: 8 },
    { x: 2, y: 9 },
    { x: 4, y: 8 },
    { x: 5, y: 5 },
    { x: 5, y: 8 },
    { x: 5, y: 10 },
    { x: 5, y: 11 },
    { x: 11, y: 7 },
    { x: 12, y: 7 },
    { x: 13, y: 7 },
    { x: 13, y: 6 },
    { x: 13, y: 8 },
    { x: 7, y: 6 },
    { x: 7, y: 7 },
    { x: 7, y: 8 },
    { x: 8, y: 8 },
    { x: 10, y: 8 },
    { x: 8, y: 8 },
    { x: 11, y: 4 },
  ]);
}


(function () {

  let playerId;
  let playerRef;
  let players = {};
  let playerElements = {};
  let coins = {};
  let coinElements = {};
  let bullets = {};
  let bulletElements = {};

  const gameContainer = document.querySelector(".game-container");
  const playerNameInput = document.querySelector("#player-name");
  const playerColorButton = document.querySelector("#player-color");


  function placeCoin() {
    const { x, y } = getRandomSafeSpot();
    const coinRef = firebase.database().ref(`coins/${getKeyString(x, y)}`);
    coinRef.set({
      x,
      y,
    })

    const coinTimeouts = [2000, 3000, 4000, 5000];
    setTimeout(() => {
      placeCoin();
    }, randomFromArray(coinTimeouts));
  }
  
  function attemptGrabCoin(x, y) {
    const coinRef = firebase.database().ref(`coins/${getKeyString(x, y)}`);
    coinRef.once("value").then(function(snapshot) {
      //check if grabs coin - same position
    if(snapshot.exists()){
        console.log("aaaaaaa")
        coinRef.remove()
        playerRef.update({
          coins: players[playerId].coins + 1,
        })
    }
 
  });

    // const key = getKeyString(x, y);
    // if (coins[key]) {
    //   console.log("grabbbb");
    //   console.log(key)
    //   console.log(coins);
    //   // Remove this key from data, then uptick Player's coin count
    //   firebase.database().ref(`coins/${key}`).remove();
    //   playerRef.update({
    //     coins: players[playerId].coins + 1,
    //   })
    // }
  }


  function handleArrowPress(xChange=0, yChange=0) {
    const newX = players[playerId].x + xChange;
    const newY = players[playerId].y + yChange;

    if(players[playerId].z > 0){
      //if jump - dont do anything
      return;
    }

    if (!isSolid(newX, newY)) {
      //move to the next space
      players[playerId].x = newX;
      players[playerId].y = newY;
      if (xChange === 1) {
        players[playerId].direction = "right";
      }
      if (xChange === -1) {
        players[playerId].direction = "left";
      }
      playerRef.set(players[playerId]);
      attemptGrabCoin(newX, newY);
    }
  }

  
  
  function jump(momentom=0){
    let newX = players[playerId].x;
    let newY = players[playerId].y;
    let newZ = 0; //players[playerId].z;
    const initialY = newY;
    accelaration = -0.2;
    //land = false
    let speed = momentom;
    console.log(speed);

    var jump = setInterval(function() {
      if(newZ<=0 && speed < 0 ){
        clearInterval(jump);
        console.log("-------")
        speed = 0;
        accelaration = 0;
        players[playerId].y = initialY;
        newZ = 0;
        players[playerId].z = 0;
        playerRef.set(players[playerId]);
        return;
      }

      console.log(newZ);
      speed += accelaration; //1.8
      newZ = players[playerId].z + speed; //-1.8
      newY = newY - newZ;
      players[playerId].y = newY;
      playerRef.set(players[playerId]);
    }, 250 / 30);
  }
  
  
  /*
  function jump(momentom=0){
    let newX = players[playerId].x;
    let newY = players[playerId].y;
    
    const initialY = newY;
    accelaration = -0.2;
    //land = false
    let speed = momentom;

    var jump = setInterval(function() {
      if(initialY<newY){
        clearInterval(jump);
        console.log("-------")
        speed = 0;
        accelaration = 0;
        players[playerId].y = initialY;
        playerRef.set(players[playerId]);
        return;
      }
      console.log(speed)
      speed += accelaration;
      newY = players[playerId].y - speed;
      players[playerId].y = newY;
      playerRef.set(players[playerId]);
    }, 250 / 30);
  }
  */

  function getDistance(x1, y1, x2, y2){
    let y = x2 - x1;
    let x = y2 - y1;
    
    return Math.sqrt(x * x + y * y);
}


// // working on it
//   function shoot(speed=0.5, distance=5){
//     const initialX = players[playerId].x;
//     const initialY = players[playerId].y;
//     const shooterId = playerId;
//     let y = initialY;
//     let x = initialX;
//     var time_stamp = new Date().getTime();

//     const bulletKey = getKeyString(shooterId, time_stamp);
//     const bulletRef = firebase.database().ref(`bullets/${bulletKey}`);
//     bulletRef.set({
//       shooterId,
//       time_stamp,
//       x,
//       y,
//     })
    
//     var shoot = setInterval(function() {
//       if(getDistance(initialX, initialY, x, y) >= distance){
//         clearInterval(shoot);
//         console.log("-------");
//         bulletRef.remove();
//         return;
//       }
//       x -= speed;
//       bulletRef.set({
//         shooterId,
//         time_stamp,
//         x,
//         y,
//       })
//     }, 500 / 30);
//   }


/*
function check_if_bullet_hit_player(bulletRef){
  console.log("bulletRef.x");
  var aaaaa = "a";

  bulletRef.once("value").then(function(snapshot) {
    console.log(snapshot.val());
    let bulletX = snapshot.val().x;
    let bulletY = snapshot.val().y;
    let shooterId = snapshot.val().shooterId;
    //loop over players
    
    
    const allPlayersRef = firebase.database().ref(`players`);
    
    allPlayersRef.once("value", (snapshot) => {
      //Fires whenever a change occurs
      
      players = snapshot.val() || {};
      
      Object.keys(players).forEach((key) => {
          console.log("key");
          console.log(players[key].x);
          if(getDistance(players[key].x, players[key].y, bulletX, bulletY) < 0.5){

            if(players[key].id != shooterId){ //not the shooter
              aaaaa = "axaxaxaxaxaax";
              alert("hittttttt");
              console.log("hittttttt");
              console.log(players[key].id);

              hitPlayerRef = firebase.database().ref(`players/${players[key].id}`);
              console.log("hitPlayerRef");
              console.log(hitPlayerRef)
              hitPlayerRef.remove();
              // playerRef.update({
              //   health: 10,
              //   x: 5,
              // });
              
              // allPlayersRef.update({
              //   health: 10, //players[key].health - 10,
              // })
              return true;

            }
          }
      });
    });
  })
  console.log(aaaaa);
}
*/
function check_if_bullet_hit_player_olddddd(bulletRef){
  //bulletRef.once("value").then(function(snapshot) {
  return bulletRef.get().then(snapshot => {
    let bulletX = snapshot.val().x;
    let bulletY = snapshot.val().y;
    let shooterId = snapshot.val().shooterId;
    //loop over players

    const allPlayersRef = firebase.database().ref(`players`);
    
    allPlayersRef.once("value", (snapshot) => {
      //Fires whenever a change occurs
      
      players = snapshot.val() || {};

      Object.keys(players).forEach((key) => {
          console.log("key");
          console.log(players[key].x);
          if(getDistance(players[key].x, players[key].y, bulletX, bulletY) < 0.5){

            if(players[key].id != shooterId){ //not the shooter

              console.log(players[key].id);

              hitPlayerRef = firebase.database().ref(`players/${players[key].id}`);
              console.log("hitPlayerRef");
              console.log(hitPlayerRef)
              hitPlayerRef.remove();
              // playerRef.update({
              //   health: 10,
              //   x: 5,
              // });
              
              // allPlayersRef.update({
              //   health: 10, //players[key].health - 10,
              // })
              return true;

            }
          }
      });
    });
  })
}
function check_if_bullet_hit_player(bulletRef) {
  let bulletX;
  let bulletY;
  let shooterId;
  return bulletRef.get().then(snapshot => {
      bulletX = snapshot.val().x;
      bulletY = snapshot.val().y;
      shooterId = snapshot.val().shooterId;

      //loop over players
      const allPlayersRef = firebase.database().ref(`players`);
      return allPlayersRef.get();  // HERE we chain the promise
  }).then(allPlayersSnap => {
          players = allPlayersSnap.val() || {};
          let player_got_shot = "";

          Object.keys(players).forEach((key) => {
              if (getDistance(players[key].x, players[key].y, bulletX, bulletY) < 0.5 && players[key].id != shooterId) {
                player_got_shot = players[key].id;
              }
          });
          return player_got_shot;
      });

}



// working on it
function shoot(speed=0.5, distance=5, targetX, targetY){
  const initialX = players[playerId].x;
  const initialY = players[playerId].y;
  const shooterId = playerId;
  let y = initialY;
  let x = initialX;
  var time_stamp = new Date().getTime();

  const bulletKey = getKeyString(shooterId, time_stamp);
  const bulletRef = firebase.database().ref(`bullets/${bulletKey}`);
  bulletRef.set({
    shooterId,
    time_stamp,
    x,
    y,
  })


  //https://impactjs.com/forums/code/shoot-where-i-click-short-tutorial/page/1

  var r = Math.atan2(targetY-initialY, targetX-initialX)*360; //Gives angle in radians from player's location to the mouse location, assuming directly right is 0
  //console.log("-----------")
  //console.log(r);

  
  var shoot = setInterval(function() {
    if(getDistance(initialX, initialY, x, y) >= distance){
      clearInterval(shoot);
      console.log("-------");
      bulletRef.remove();
      return;
    }
    // if(check_if_bullet_hit_player(bulletRef)){
    //   alert("aaaaa");
    //   clearInterval(shoot); 
    //   bulletRef.remove();
    //   return;
    // }
    check_if_bullet_hit_player(bulletRef).then(player_got_shot_id => {
      if (player_got_shot_id != ""){
        clearInterval(shoot); 
        bulletRef.remove();
        hitPlayerRef = firebase.database().ref(`players/${player_got_shot_id}`);
        hitPlayerRef.once("value").then(function(){
          alert("hi");
          hitPlayerRef.remove();
          //hitPlayerRef.remove();
        })
        
        //hitPlayerRef.remove();
          // hitPlayerRef.update({
          //   name: "hello"
          // })
     
        // hitPlayerRef.once("value").then(function(snapshot) {
        //   hitPlayerRef.update({
        //     health: players[player_got_shot_id].health - 20,
        //   })
        // })
        //alert(players[player_got_shot_id].health);

        
        /*
        PlayerGotShotRef = firebase.database().ref(`players/${player_got_shot_id}`);
        PlayerGotShotRef.then(snapshot =>{
          PlayerGotShotRef.remove();
        })
        */
        return;
      }
    })
    x += Math.cos(r)*speed;
    y += Math.sin(r)*speed;
    bulletRef.set({
      shooterId,
      time_stamp,
      x,
      y,
    })

    //check if hit player
  }, 500 / 30);
}











  
  function initGame() {

    new KeyPressListener("KeyW", () => handleArrowPress(0, -1))
    new KeyPressListener("KeyS", () => handleArrowPress(0, 1))
    new KeyPressListener("KeyA", () => handleArrowPress(-1, 0))
    new KeyPressListener("KeyD", () => handleArrowPress(1, 0))
    new KeyPressListener("KeyG", () => jump(3.2))
    new KeyPressListener("click", () => shoot())
    
    document.querySelector('.game-container').onclick = (e) => {
      shoot(0.5, 5, e.clientX, e.clientY);
    };

    const allPlayersRef = firebase.database().ref(`players`);
    const allCoinsRef = firebase.database().ref(`coins`);
    const allBulletsRef = firebase.database().ref(`bullets`);
    

    //update values in real time
    allPlayersRef.on("value", (snapshot) => {
      //Fires whenever a change occurs
      players = snapshot.val() || {};
      Object.keys(players).forEach((key) => {
        const characterState = players[key];
        let el = playerElements[key];
        // Now update the DOM
        //el.querySelector(".Character_health").progress = characterState.name;
        el.querySelector(".Character_name").innerText = characterState.name;
        el.querySelector(".Character_coins").innerText = characterState.coins;
        el.querySelector(".Character_health").value = characterState.health;

        //el.querySelector(".Character_shadow").innerHTML = "9";
        el.querySelector(".Character_shadow").style.top -= characterState.z;

        el.setAttribute("data-color", characterState.color);
        el.setAttribute("data-direction", characterState.direction);
        const left = 16 * characterState.x + "px";
        const top = 16 * characterState.y - 4 + "px";
        el.style.transform = `translate3d(${left}, ${top}, 0)`;
      })
    })
    allPlayersRef.on("child_added", (snapshot) => {
      //Fires whenever a new node is added the tree
      const addedPlayer = snapshot.val();
      const characterElement = document.createElement("div");
      characterElement.classList.add("Character", "grid-cell");
      if (addedPlayer.id === playerId) {
        characterElement.classList.add("you");
      }
      characterElement.innerHTML = (`
        <progress class="Character_health" value="50" max="100"></progress>
        <div class="Character_shadow grid-cell"></div>
        <div class="Character_sprite grid-cell"></div>
        <div class="Character_name-container">
          <span class="Character_name"></span>
          <span class="Character_coins">0</span>
        </div>
        <div class="Character_you-arrow"></div>
      `);
      playerElements[addedPlayer.id] = characterElement;

      //Fill in some initial state
      characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
      characterElement.querySelector(".Character_coins").innerText = addedPlayer.coins;
      characterElement.setAttribute("data-color", addedPlayer.color);
      characterElement.setAttribute("data-direction", addedPlayer.direction);
      const left = 16 * addedPlayer.x + "px";
      const top = 16 * addedPlayer.y - 4 + "px";
      characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
      //characterElement.querySelector(".Character_shadow").innerHTML = "10";
      //characterElement.querySelector(".Character_shadow").y -= 2;


      gameContainer.appendChild(characterElement);
    })

    //Remove character DOM element after they leave
    allPlayersRef.on("child_removed", (snapshot) => {
      const removedKey = snapshot.val().id;
      gameContainer.removeChild(playerElements[removedKey]);
      delete playerElements[removedKey];
    })


    allCoinsRef.on("child_added", (snapshot) => {
      const coin = snapshot.val();
      const key = getKeyString(coin.x, coin.y);
      coins[key] = true;

      // Create the DOM Element
      const coinElement = document.createElement("div");
      coinElement.classList.add("Coin", "grid-cell");
      coinElement.innerHTML = `
        <div class="Coin_shadow grid-cell"></div>
        <div class="Coin_sprite grid-cell"></div>
      `;

      // Position the Element
      const left = 16 * coin.x + "px";
      const top = 16 * coin.y - 4 + "px";
      coinElement.style.transform = `translate3d(${left}, ${top}, 0)`;

      // Keep a reference for removal later and add to DOM
      coinElements[key] = coinElement;
      gameContainer.appendChild(coinElement);
    })
    allCoinsRef.on("child_removed", (snapshot) => {
      const {x,y} = snapshot.val();
      const keyToRemove = getKeyString(x,y);
      console.log("keyToRemove");
      console.log(coinElements[keyToRemove]);
      gameContainer.removeChild( coinElements[keyToRemove] );
      delete coinElements[keyToRemove];
    })




    allBulletsRef.on("value", (snapshot) => {
      //Fires whenever a change occurs
      bullets = snapshot.val() || {};
      Object.keys(bullets).forEach((key) => {
        const bulletState = bullets[key];
        let el = bulletElements[key];
        // Now update the DOM
        const left = 16 * bulletState.x + "px";
        const top = 16 * bulletState.y - 4 + "px";
        console.log(bulletElements);
        el.style.transform = `translate3d(${left}, ${top}, 0)`;
      })
    })

    allBulletsRef.on("child_added", (snapshot) => {
      const bullet = snapshot.val();
      const key = getKeyString(bullet.shooterId, bullet.time_stamp);
      console.log("ooooooo");
      console.log(key);
      bullets[key] = true;
      // Create the DOM Element
      const bulletElement = document.createElement("div");
      bulletElement.classList.add("Bullet", "grid-cell");
      bulletElement.innerHTML = `
        <div class="Bullet_shadow grid-cell"></div>
        <div class="Bullet_sprite grid-cell"></div>
      `;

      // Position the Element
      const left = 16 * bullet.x + "px";
      const top = 16 * bullet.y - 4 + "px";
      bulletElement.style.transform = `translate3d(${left}, ${top}, 0)`;
      bulletElement.id = key;

      // Keep a reference for removal later and add to DOM
      bulletElements[key] = bulletElement;
      gameContainer.appendChild(bulletElement);
    })
    allBulletsRef.on("child_removed", (snapshot) => {
      const {x,y,shooterId, time_stamp} = snapshot.val();
      console.log("hhhhhhhhh")
      console.log(gameContainer);
      console.log( getKeyString(shooterId,time_stamp));
      const keyToRemove = getKeyString(shooterId,time_stamp);
      gameContainer.removeChild( bulletElements[keyToRemove] );
      delete bulletElements[keyToRemove];
    })


    //Updates player name with text input
    playerNameInput.addEventListener("change", (e) => {
      const newName = e.target.value || createName();
      playerNameInput.value = newName;
      playerRef.update({
        name: newName
      })
    })

    //Update player color on button click
    playerColorButton.addEventListener("click", () => {
      const mySkinIndex = playerColors.indexOf(players[playerId].color);
      const nextColor = playerColors[mySkinIndex + 1] || playerColors[0];
      playerRef.update({
        color: nextColor
      })
    })

    //Place my first coin
    placeCoin();

  }

  firebase.auth().onAuthStateChanged((user) => {
    console.log(user)
    if (user) {
      //You're logged in!
      playerId = user.uid;
      playerRef = firebase.database().ref(`players/${playerId}`);

      const name = createName();
      playerNameInput.value = name;

      const {x, y} = getRandomSafeSpot();
      let z = 0; //height
      let health = 100;

      playerRef.set({
        id: playerId,
        name,
        direction: "right",
        color: randomFromArray(playerColors),
        health,
        x,
        y,
        z,
        coins: 0,
      })

      //Remove me from Firebase when I diconnect
      playerRef.onDisconnect().remove();

      //Begin the game now that we are signed in
      initGame();
    } else {
      //You're logged out.
    }
  })

  firebase.auth().signInAnonymously().catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    console.log(errorCode, errorMessage);
  });


})();
