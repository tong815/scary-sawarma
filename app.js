// Stage III keeps the game simple: the player clicks locations, tasks, items,
// and encounter choices. There is no real-time movement or advanced AI.

const locations = ["Counter", "Kitchen", "Storage Room", "Dining Area", "Back Door"];

// Nearby locations tell the monster where it can move after player actions.
// This is simple pathfinding: each room only knows its neighboring rooms.
const nearbyLocations = {
  Counter: ["Kitchen", "Dining Area", "Back Door"],
  Kitchen: ["Counter", "Storage Room", "Dining Area"],
  "Storage Room": ["Kitchen", "Back Door"],
  "Dining Area": ["Counter", "Kitchen"],
  "Back Door": ["Counter", "Storage Room"]
};

// More tasks make the normal work-shift ending harder than Stage I.
const tasks = [
  { name: "Take order", location: "Counter", completed: false },
  { name: "Cook shawarma", location: "Kitchen", completed: false },
  { name: "Serve customer", location: "Dining Area", completed: false },
  { name: "Clean table", location: "Dining Area", completed: false },
  { name: "Check storage room", location: "Storage Room", completed: false },
  { name: "Refill sauce", location: "Kitchen", completed: false },
  { name: "Fix flickering light", location: "Dining Area", completed: false },
  { name: "Lock front door", location: "Counter", completed: false },
  { name: "Wash dishes", location: "Kitchen", completed: false },
  { name: "Inspect strange sound", location: "Storage Room", completed: false }
];

// Items are found by visiting their location and clicking the item button.
// Each item unlocks a useful survival option.
const items = [
  { name: "Knife", location: "Kitchen", found: false, effect: "Unlocks Fight Back." },
  { name: "Flashlight", location: "Storage Room", found: false, effect: "Lowers fear from scary events." },
  { name: "Key", location: "Back Door", found: false, effect: "Unlocks the Escape ending." }
];

const scaryEvents = [
  { progressNeeded: 1, message: "The lights flicker and the fryer turns on by itself.", fear: 12, used: false },
  { progressNeeded: 2, message: "A strange noise scratches from the storage room.", fear: 16, used: false },
  { progressNeeded: 3, message: "A tall shadow appears near the dining area, then disappears.", fear: 18, used: false },
  { progressNeeded: 4, message: "The back door opens by itself. Cold air enters the restaurant.", fear: 18, used: false },
  { progressNeeded: 6, message: "Something whispers your name from behind the counter.", fear: 14, used: false },
  { progressNeeded: 8, message: "Every light goes red for one second.", fear: 18, used: false }
];

const creepyMessages = [
  "The shawarma knife is not where you left it.",
  "A chair moves a little when you look away.",
  "The menu board changes for one second.",
  "You hear breathing through the back door.",
  "The kitchen fan sounds like whispering."
];

let currentLocation = "Counter";
let monsterLocation = "Storage Room";
let monsterActive = false;
let monsterAnger = 0;
let dangerLevel = "Quiet";
let fear = 0;
let gameFinished = false;
let encounterActive = false;

const locationName = document.querySelector("#locationName");
const progressCount = document.querySelector("#progressCount");
const totalTasks = document.querySelector("#totalTasks");
const fearFill = document.querySelector("#fearFill");
const fearNumber = document.querySelector("#fearNumber");
const angerFill = document.querySelector("#angerFill");
const angerNumber = document.querySelector("#angerNumber");
const dangerLevelText = document.querySelector("#dangerLevel");
const nearbyWarning = document.querySelector("#nearbyWarning");
const eventMessage = document.querySelector("#eventMessage");
const taskList = document.querySelector("#taskList");
const itemList = document.querySelector("#itemList");
const escapeButton = document.querySelector("#escapeButton");
const restartButton = document.querySelector("#restartButton");
const mapButtons = document.querySelectorAll(".map-area");
const game = document.querySelector(".game");
const encounterPanel = document.querySelector("#encounterPanel");
const encounterMessage = document.querySelector("#encounterMessage");
const hideButton = document.querySelector("#hideButton");
const runButton = document.querySelector("#runButton");
const fightButton = document.querySelector("#fightButton");
const jumpScare = document.querySelector("#jumpScare");
const jumpScareImage = document.querySelector("#jumpScareImage");

const scaryImagePaths = GameAssets.images;

function preloadScaryImages() {
  scaryImagePaths.forEach(imagePath => {
    const image = new Image();
    image.src = imagePath;
  });
}

function moveToLocation(location) {
  if (gameFinished || encounterActive) {
    return;
  }

  currentLocation = location;
  eventMessage.textContent = `You moved to the ${currentLocation}.`;
  finishPlayerAction();
}

function completeTask(taskIndex) {
  if (gameFinished || encounterActive) {
    return;
  }

  const task = tasks[taskIndex];

  if (task.completed) {
    return;
  }

  if (task.location !== currentLocation) {
    eventMessage.textContent = `Go to the ${task.location} to complete "${task.name}".`;
    return;
  }

  task.completed = true;
  increaseMonsterAnger(5);
  increaseFear(2);
  eventMessage.textContent = `Task complete: ${task.name}. The shift feels worse now.`;

  checkScaryEvents();
  checkWinOrLose();
  finishPlayerAction();
}

function pickUpItem(itemIndex) {
  if (gameFinished || encounterActive) {
    return;
  }

  const item = items[itemIndex];

  if (item.found) {
    return;
  }

  if (item.location !== currentLocation) {
    eventMessage.textContent = `Go to the ${item.location} to find the ${item.name}.`;
    return;
  }

  // Items stay in the inventory after pickup and change future choices.
  item.found = true;
  if (item.name === "Flashlight") {
    fear = Math.max(0, fear - 8);
  }
  eventMessage.textContent = `You found the ${item.name}. ${item.effect}`;
  finishPlayerAction();
}

function finishPlayerAction() {
  maybeShowCreepyMessage();
  checkWinOrLose();

  if (monsterActive && !gameFinished) {
    moveMonster();
    checkMonsterEncounter();
  }

  updateScreen();
}

function getCompletedTaskCount() {
  return tasks.filter(task => task.completed).length;
}

function hasItem(itemName) {
  return items.some(item => item.name === itemName && item.found);
}

function increaseFear(amount) {
  fear = Math.min(100, fear + amount);
}

function increaseMonsterAnger(amount) {
  monsterAnger = Math.min(100, monsterAnger + amount);
}

function decreaseMonsterAnger(amount) {
  monsterAnger = Math.max(0, monsterAnger - amount);
}

function checkScaryEvents() {
  const completedTasks = getCompletedTaskCount();

  for (const scaryEvent of scaryEvents) {
    if (!scaryEvent.used && completedTasks >= scaryEvent.progressNeeded) {
      scaryEvent.used = true;

      // The flashlight makes scary events less damaging, but never harmless.
      const fearAmount = hasItem("Flashlight") ? Math.ceil(scaryEvent.fear * 0.55) : scaryEvent.fear;
      increaseFear(fearAmount);
      increaseMonsterAnger(6);
      monsterActive = true;
      eventMessage.textContent = scaryEvent.message;
      triggerJumpScare();
      return;
    }
  }
}

function maybeShowCreepyMessage() {
  if (gameFinished || encounterActive || Math.random() > 0.28) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * creepyMessages.length);
  eventMessage.textContent = creepyMessages[randomIndex];
  increaseFear(hasItem("Flashlight") ? 1 : 3);
}

function moveMonster() {
  const possibleLocations = nearbyLocations[monsterLocation];
  const shouldMove = Math.random() < 0.75;

  if (shouldMove) {
    const randomIndex = Math.floor(Math.random() * possibleLocations.length);
    monsterLocation = possibleLocations[randomIndex];
  }
}

function checkMonsterEncounter() {
  if (!monsterActive || monsterLocation !== currentLocation || gameFinished) {
    return;
  }

  // Encounters pause normal map, task, and item actions until the player chooses.
  encounterActive = true;
  document.body.classList.add("scare-active");
  encounterMessage.textContent = "It blocks your path. Hide, run, or fight back.";
  encounterPanel.classList.remove("hidden");
}

function chooseEncounterAction(choice) {
  if (!encounterActive || gameFinished) {
    return;
  }

  if (choice === "hide") {
    resolveHide();
  }

  if (choice === "run") {
    resolveRun();
  }

  if (choice === "fight") {
    resolveFight();
  }

  encounterActive = false;
  encounterPanel.classList.add("hidden");
  document.body.classList.remove("scare-active");

  if (!gameFinished) {
    checkWinOrLose();
  }

  updateScreen();
}

function resolveHide() {
  const successChance = monsterAnger > 70 ? 0.58 : 0.78;

  if (Math.random() < successChance) {
    increaseFear(8);
    eventMessage.textContent = "You hid under the counter. It passed by.";
    monsterLocation = getRandomDifferentLocation(currentLocation);
  } else {
    increaseFear(35);
    increaseMonsterAnger(10);
    eventMessage.textContent = "You tried to hide, but it heard you breathing.";
    maybeMonsterCatchesPlayer(0.18);
  }
}

function resolveRun() {
  const successChance = monsterAnger > 70 ? 0.42 : 0.58;
  currentLocation = getRandomDifferentLocation(currentLocation);

  if (Math.random() < successChance) {
    increaseFear(16);
    eventMessage.textContent = `You ran to the ${currentLocation}. It lost you for now.`;
    monsterLocation = getRandomDifferentLocation(currentLocation);
  } else {
    increaseFear(42);
    increaseMonsterAnger(12);
    eventMessage.textContent = "You ran, but it was faster than the sound of your footsteps.";
    maybeMonsterCatchesPlayer(0.26);
  }
}

function resolveFight() {
  const successChance = hasItem("Knife") ? 0.48 : 0.08;

  if (Math.random() < successChance) {
    decreaseMonsterAnger(24);
    increaseFear(14);
    monsterLocation = getRandomDifferentLocation(currentLocation);
    eventMessage.textContent = "You forced it back for a moment. It is not gone.";
  } else {
    increaseFear(hasItem("Knife") ? 38 : 55);
    increaseMonsterAnger(hasItem("Knife") ? 18 : 28);
    eventMessage.textContent = hasItem("Knife")
      ? "You fought back, but the monster barely slowed down."
      : "You had no weapon. Fighting was a terrible idea.";
    maybeMonsterCatchesPlayer(hasItem("Knife") ? 0.2 : 0.42);
  }
}

function maybeMonsterCatchesPlayer(baseChance) {
  const extraChance = fear >= 80 ? 0.2 : 0;

  if (Math.random() < baseChance + extraChance) {
    gameFinished = true;
    eventMessage.textContent = "The monster found you before you could escape.";
  }
}

function getRandomDifferentLocation(location) {
  const choices = locations.filter(place => place !== location);
  const randomIndex = Math.floor(Math.random() * choices.length);
  return choices[randomIndex];
}

function escapeRestaurant() {
  if (!hasItem("Key") || currentLocation !== "Back Door" || encounterActive || gameFinished) {
    return;
  }

  gameFinished = true;
  eventMessage.textContent = "You escaped the restaurant, but the monster is still inside.";
  updateScreen();
}

function checkWinOrLose() {
  const allTasksDone = getCompletedTaskCount() === tasks.length;

  if (monsterAnger >= 100) {
    gameFinished = true;
    eventMessage.textContent = "The monster became unstoppable.";
    return;
  }

  if (fear >= 100) {
    gameFinished = true;
    eventMessage.textContent = "You panicked and ran blindly into the dark.";
    return;
  }

  if (allTasksDone && fear < 100) {
    gameFinished = true;
    eventMessage.textContent = "You finished the impossible shift and survived the night.";
  }
}

function getDangerLevel() {
  if (!monsterActive) {
    return "Quiet";
  }

  if (monsterLocation === currentLocation) {
    return "Encounter";
  }

  if (nearbyLocations[currentLocation].includes(monsterLocation)) {
    return "Nearby";
  }

  if (monsterAnger >= 70 || fear >= 75) {
    return "High";
  }

  return "Hunting";
}

function getRandomScaryImage() {
  if (scaryImagePaths.length === 0) {
    return "";
  }

  const randomIndex = Math.floor(Math.random() * scaryImagePaths.length);
  return scaryImagePaths[randomIndex];
}

function triggerJumpScare() {
  const imagePath = getRandomScaryImage();

  if (!imagePath) {
    return;
  }

  jumpScareImage.src = imagePath;
  jumpScare.classList.add("show");
  document.body.classList.add("scare-active");

  setTimeout(() => {
    jumpScare.classList.remove("show");
    document.body.classList.remove("scare-active");
  }, 1000);
}

function updateScreen() {
  dangerLevel = getDangerLevel();
  locationName.textContent = currentLocation;
  progressCount.textContent = getCompletedTaskCount();
  totalTasks.textContent = tasks.length;
  fearNumber.textContent = `${fear} / 100`;
  angerNumber.textContent = `${monsterAnger} / 100`;
  dangerLevelText.textContent = dangerLevel;
  fearFill.style.width = `${fear}%`;
  angerFill.style.width = `${monsterAnger}%`;

  const monsterNearby = monsterActive && nearbyLocations[currentLocation].includes(monsterLocation);
  nearbyWarning.textContent = getWarningText(monsterNearby);
  escapeButton.classList.toggle("hidden", !canEscape());
  game.classList.toggle("game-over", gameFinished);
  document.body.classList.toggle("danger-high", monsterAnger >= 70 || fear >= 75);

  mapButtons.forEach(button => {
    const isCurrentLocation = button.dataset.location === currentLocation;
    const isMonsterNear = monsterActive && button.dataset.location === monsterLocation;
    button.classList.toggle("active", isCurrentLocation);
    button.classList.toggle("monster-near", isMonsterNear);
  });

  renderTasks();
  renderItems();
}

function getWarningText(monsterNearby) {
  if (!monsterActive) {
    return "No monster signs yet.";
  }

  if (monsterLocation === currentLocation) {
    return "It is here. Choose now.";
  }

  if (monsterNearby) {
    return "Heavy footsteps are nearby.";
  }

  return "The monster is moving somewhere in the restaurant.";
}

function canEscape() {
  return hasItem("Key") && currentLocation === "Back Door" && !gameFinished && !encounterActive;
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const taskButton = document.createElement("button");
    taskButton.className = "task-button";
    taskButton.textContent = `${task.name} - ${task.location}`;
    taskButton.disabled = task.completed || gameFinished || encounterActive;
    taskButton.addEventListener("click", () => completeTask(index));
    taskList.appendChild(taskButton);
  });
}

function renderItems() {
  itemList.innerHTML = "";

  items.forEach((item, index) => {
    const itemButton = document.createElement("button");
    itemButton.className = "item-button";
    itemButton.textContent = item.found
      ? `${item.name} found - ${item.effect}`
      : `Find ${item.name} - ${item.location}`;
    itemButton.disabled = item.found || gameFinished || encounterActive;
    itemButton.addEventListener("click", () => pickUpItem(index));
    itemList.appendChild(itemButton);
  });
}

function restartGame() {
  currentLocation = "Counter";
  monsterLocation = "Storage Room";
  monsterActive = false;
  monsterAnger = 0;
  dangerLevel = "Quiet";
  fear = 0;
  gameFinished = false;
  encounterActive = false;

  tasks.forEach(task => {
    task.completed = false;
  });

  items.forEach(item => {
    item.found = false;
  });

  scaryEvents.forEach(scaryEvent => {
    scaryEvent.used = false;
  });

  encounterPanel.classList.add("hidden");
  document.body.classList.remove("scare-active", "danger-high");
  eventMessage.textContent = "The late-night shift has started. Everything feels normal... for now.";
  updateScreen();
}

mapButtons.forEach(button => {
  button.addEventListener("click", () => moveToLocation(button.dataset.location));
});

hideButton.addEventListener("click", () => chooseEncounterAction("hide"));
runButton.addEventListener("click", () => chooseEncounterAction("run"));
fightButton.addEventListener("click", () => chooseEncounterAction("fight"));
escapeButton.addEventListener("click", escapeRestaurant);
restartButton.addEventListener("click", restartGame);

preloadScaryImages();
updateScreen();
