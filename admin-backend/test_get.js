async function test() {
  try {
    const res1 = await fetch('http://rms.cloudedata.in:3000/');
    console.log('GET http://rms.cloudedata.in:3000/ Status:', res1.status);
    console.log('GET http://rms.cloudedata.in:3000/ Body:', await res1.text());
  } catch (err) {
    console.error('http :3000 failed:', err.message);
  }

  try {
    const res2 = await fetch('https://rms.cloudedata.in:3000/');
    console.log('GET https://rms.cloudedata.in:3000/ Status:', res2.status);
    console.log('GET https://rms.cloudedata.in:3000/ Body:', await res2.text());
  } catch (err) {
    console.error('https :3000 failed:', err.message);
  }
}
test();
