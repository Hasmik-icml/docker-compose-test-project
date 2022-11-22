const { PrismaClient } = require('@prisma/client');

const prisma =new PrismaClient();

const permissions = ['Filtered', 'Product'];


async function main() {
    const res = await prisma.permissions.deleteMany();
    console.log("res=", res);
    // await prisma.$transaction([res]);
    
    for (let permission of permissions) {
        await prisma.permissions.create({
            data: {
                per_name: permission
            },
        }); 
    }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
})