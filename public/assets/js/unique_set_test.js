import { UniqueArray, UniqueSet } from "./unique_set.js";

const set1 = new UniqueSet([5, 2, 3]);
set1.append(4);
set1.append(5);
console.log(set1);
set1.remove(3);
console.log(set1);

const set2 = new UniqueArray([5, 2, 3]);
set2.append(4);
set2.append(5);
console.log(set2);
set2.remove(3);
console.log(set2);

