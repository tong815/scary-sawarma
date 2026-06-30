// These locations are the clickable rooms in the restaurant.
// Each button in index.html uses data-location to match one of these names.
const locations = ["Counter", "Kitchen", "Storage Room", "Dining Area", "Back Door"];

// Each task has a name, a place where it should happen, and a completed value.
// Students can add more tasks by adding more objects to this list.
const tasks = [
  { name: "Take order", location: "Counter", completed: false },
  { name: "Cook shawarma", location: "Kitchen", completed: false },
  { name: "Serve customer", location: "Dining Area", completed: false },
  { name: "Clean table", location: "Dining Area", completed: false },
  { name: "Check storage room", location: "Storage Room", completed: false }
];

// Scary events appear after progress reaches certain task counts.
// This keeps the first moments calm, then slowly makes the game scarier.
const scaryEvents = [
  { progressNeeded: 1, message: "The lights flicker above the counter.", fear: 15, used: false },
  { progressNeeded: 2, message: "A strange noise scratches from the storage room.", fear: 20, used: false },
  { progressNeeded: 3, message: "A tall shadow appears near the dining area, then disappears.", fear: 25, used: false },
  { progressNeeded: 4, message: "The back door opens by itself. Cold air enters the restaurant.", fear: 30, used: false }
];

let currentLocation = "Counter";
let fear = 0;
let gameFinished = false;

const locationName = document.querySelector("#locationName");
const progressCount = document.querySelector("#progressCount");
const fearFill = document.querySelector("#fearFill");
const fearNumber = document.querySelector("#fearNumber");
const eventMessage = document.querySelector("#eventMessage");
const taskList = document.querySelector("#taskList");
const restartButton = document.querySelector("#restartButton");
const mapButtons = document.querySelectorAll(".map-area");
const game = document.querySelector(".game");

function moveToLocation(location) {
  if (gameFinished) {
    return;
  }

  // The current location changes when the player clicks a room button.
  currentLocation = location;
  eventMessage.textContent = `You moved to the ${currentLocation}.`;
  updateScreen();
}

function completeTask(taskIndex) {
  if (gameFinished) {
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

  // A task becomes complete only when the player is in the correct location.
  task.completed = true;
  eventMessage.textContent = `Task complete: ${task.name}.`;

  checkScaryEvents();
  checkWinOrLose();
  updateScreen();
}

function getCompletedTaskCount() {
  return tasks.filter(task => task.completed).length;
}

function checkScaryEvents() {
  const completedTasks = getCompletedTaskCount();

  for (const scaryEvent of scaryEvents) {
    if (!scaryEvent.used && completedTasks >= scaryEvent.progressNeeded) {
      // A scary event can only happen once.
      scaryEvent.used = true;
      eventMessage.textContent = scaryEvent.message;

      // The fear meter increases when scary events happen.
      fear = fear + scaryEvent.fear;
      if (fear > 100) {
        fear = 100;
      }
      return;
    }
  }
}

function checkWinOrLose() {
  const allTasksDone = getCompletedTaskCount() === tasks.length;

  // Lose condition: fear reaches 100 before the player finishes.
  if (fear >= 100) {
    gameFinished = true;
    eventMessage.textContent = "You ran away from the restaurant!";
  }

  // Win condition: all tasks are finished before fear reaches 100.
  if (allTasksDone && fear < 100) {
    gameFinished = true;
    eventMessage.textContent = "You finished the night shift and survived!";
  }
}

function updateScreen() {
  locationName.textContent = currentLocation;
  progressCount.textContent = getCompletedTaskCount();
  fearNumber.textContent = `${fear} / 100`;
  fearFill.style.width = `${fear}%`;

  game.classList.toggle("game-over", gameFinished);

  mapButtons.forEach(button => {
    const isCurrentLocation = button.dataset.location === currentLocation;
    button.classList.toggle("active", isCurrentLocation);
  });

  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const taskButton = document.createElement("button");
    taskButton.className = "task-button";
    taskButton.textContent = `${task.name} - ${task.location}`;
    taskButton.disabled = task.completed || gameFinished;
    taskButton.addEventListener("click", () => completeTask(index));
    taskList.appendChild(taskButton);
  });
}

function restartGame() {
  currentLocation = "Counter";
  fear = 0;
  gameFinished = false;

  tasks.forEach(task => {
    task.completed = false;
  });

  scaryEvents.forEach(scaryEvent => {
    scaryEvent.used = false;
  });

  eventMessage.textContent = "The late-night shift has started. Everything feels normal... for now.";
  updateScreen();
}

mapButtons.forEach(button => {
  button.addEventListener("click", () => moveToLocation(button.dataset.location));
});

restartButton.addEventListener("click", restartGame);

updateScreen();
