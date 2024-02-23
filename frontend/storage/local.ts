export function setLastSelectedActionToLocalStorage(to: string) {
  if (to.length === 0) {
    return;
  }
  setItem("lastSelected", to);
}

export function getLastSelectedActionFromLocalStorage() {
  const action = getItem("lastSelected");
  if (action.length === 0) {
    return "new";
  } else {
    return action;
  }
}

function getItem(key): string {
  const item = localStorage.getItem(key);
  if (!item) {
    return "";
  }
  return item;
}

function setItem(key: string, item: string) {
  localStorage.setItem(key, item);
}
