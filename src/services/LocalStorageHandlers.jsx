const STORAGE_TAG_DATA_KEY = "storage_tag_data";
const STORAGE_INDEX_DATA_KEY = "storage_index_data";


export function enterTagOptionsIntoStorage(tag_options) {
  localStorage.setItem(STORAGE_TAG_DATA_KEY, JSON.stringify(tag_options));
}

export function enterIndexDataToStorage(index_data) {
  localStorage.setItem(STORAGE_INDEX_DATA_KEY, JSON.stringify(index_data));
}

export function retrieveTagOptionsFromStorage() {
  var data = localStorage.getItem(STORAGE_TAG_DATA_KEY);
  
  if(data ===  null) {
    return data;
  } else {
    return JSON.parse(data);
  }
}

export function retrieveIndexDataFromStorage() {
  var data = localStorage.getItem(STORAGE_INDEX_DATA_KEY);

  if(data === null) {
    return data;
  } else {
    return JSON.parse(data);
  }
}