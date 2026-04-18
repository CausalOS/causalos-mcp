
import natural from 'natural';

const s1 = "delete database rows";
const s2 = "remove table records";
const s3 = "delete users from database";

console.log("Stemming:");
console.log(`'delete' -> ${natural.PorterStemmer.stem('delete')}`);
console.log(`'deleted' -> ${natural.PorterStemmer.stem('deleted')}`);
console.log(`'deletion' -> ${natural.PorterStemmer.stem('deletion')}`);

console.log("\nDistances:");
console.log(`JW(s1, s2): ${natural.JaroWinklerDistance(s1, s2)}`);
console.log(`JW(s1, s3): ${natural.JaroWinklerDistance(s1, s3)}`);
console.log(`Dice(s1, s2): ${natural.DiceCoefficient(s1, s2)}`);
console.log(`Dice(s1, s3): ${natural.DiceCoefficient(s1, s3)}`);

const start = performance.now();
for (let i = 0; i < 1000; i++) {
    natural.DiceCoefficient(s1, s3);
}
const end = performance.now();
console.log(`\nLatency for 1000 Dice operations: ${end - start}ms`);
