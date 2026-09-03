// Note this file is used to generate hashed password to store them in db.json file
import bcrypt from 'bcryptjs';

const saltRounds = 8;

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(plainPassword, salt);
};

const run = async () => {
  const password = process.argv[2];
  
  if (password) {
    const hash = await hashPassword(password);
    console.log(`\nPassword: ${password}`);
    console.log(`Hash: ${hash}\n`);
  } else {
    const defaultPasswords = ['admin123', 'manager123', 'employee123'];
    const results = [];
    
    console.log('\nGenerating hashes...\n');
    
    for (const pwd of defaultPasswords) {
      const hash = await hashPassword(pwd);
      results.push({ password: pwd, hash });
      console.log(`${pwd} → ${hash}`);
    }
    
    console.log('\n✅ Copy these hashes to db.json:');
    console.log(JSON.stringify(results, null, 2));
    console.log('\n');
  }
};

run().catch(console.error);