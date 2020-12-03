module.exports = (error, result, scope) => {
  if (error) {
    throw error;
  }
  console.log('\nOctopus result:', result);
  console.log(`[cardinal-${scope}] Done!`);
}
