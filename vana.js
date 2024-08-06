const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const displayHeader = require('./src/displayHeader');

class Vana {
    headers(initData) {
        return {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "X-Telegram-Web-App-Init-Data": initData
        };
    }

    log(msg) {
        console.log(`[*] ${msg}`);
    }

    async waitWithCountdown(seconds) {
        for (let i = seconds; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[*] mohon tunggu ${i} detik untuk akun selanjutnya dek`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');
    }

    async getPlayerData(initData) {
        const url = 'https://www.vanadatahero.com/api/player';
        const headers = this.headers(initData);
        try {
            const response = await axios.get(url, { headers });
            return response.data;
        } catch (error) {
            this.log(`${'Lỗi khi gọi API'.red}`);
            console.error(error);
        }
    }

    async postTaskCompletion(initData, taskId, points) {
        const url = `https://www.vanadatahero.com/api/tasks/${taskId}`;
        const headers = this.headers(initData);
        const payload = {
            status: "completed",
            points: parseFloat(points)
        };

        try {
            const response = await axios.post(url, payload, { headers });
            if (response.data && response.data.message === 'Points limit exceeded') {
                this.log(`${'berhasil melakukan semua tap untuk hari ini !'.red}`);
                return false; 
            }
            return true;
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message === 'Points limit exceeded') {
                this.log(`${'berhasil melakukan semua tap untuk hari ini!'.red}`);
                return false; 
            }
            this.log(`${'Lỗi khi hoàn thành nhiệm vụ'.red}`);
            console.error(error);
            return false;
        }
    }

    async getTasks(initData) {
        const url = 'https://www.vanadatahero.com/api/tasks';
        const headers = this.headers(initData);
        try {
            const response = await axios.get(url, { headers });
            return response.data.tasks;
        } catch (error) {
            this.log(`${'Lỗi khi lấy danh sách nhiệm vụ'.red}`);
            console.error(error);
        }
    }

    async completePendingTasks(initData) {
        const tasks = await this.getTasks(initData);
        const excludeIds = [2, 17, 5, 9];
    
        for (const task of tasks) {
            if (task.completed.length === 0 && !excludeIds.includes(task.id)) { 
                const success = await this.postTaskCompletion(initData, task.id, task.points);
                if (success) {
                    this.log(`${`menjalankan misi`.green} ${task.name.yellow} ${`berhasil mendapatkan :`.green} ${task.points}`);
                } else {
                    continue;
                }
            }
        }
    }

    async processAccount(initData, accountIndex) {
        try {
	displayHeader();
            const playerData = await this.getPlayerData(initData);

            if (playerData) {
                console.log(`========== menjalankan akun ${accountIndex} | ${playerData.tgFirstName.green} ==========`);
                this.log(`${'Points:'.green} ${playerData.points.toString().white}`);
                this.log(`${'Multiplier:'.green} ${playerData.multiplier.toString().white}`);
            } else {
                this.log(`${'Lỗi: Không tìm thấy dữ liệu người dùng'.red}`);
            }

            while (true) {
                const taskCompleted = await this.postTaskCompletion(initData, 1, (Math.random() * (50000.0 - 40000.0) + 40000.0).toFixed(1));

                if (!taskCompleted) {
                    break;
                }

                const updatedPlayerData = await this.getPlayerData(initData);

                if (updatedPlayerData) {
                    this.log(`${' melakukan auto tap. Balance total Balance:'.green} ${updatedPlayerData.points.toString().white}`);
                } else {
                    this.log(`${'Lỗi: Không tìm thấy dữ liệu người dùng sau khi tap'.red}`);
                }

                await new Promise(resolve => setTimeout(resolve, 1000)); 
            }

            await this.completePendingTasks(initData);

        } catch (error) {
            this.log(`${'Lỗi khi xử lý tài khoản'.red}`);
            console.error(error);
        }
    }

    async main() {
        const dataFile = path.join(__dirname, 'data.txt');
        const initDataList = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        for (let i = 0; i < initDataList.length; i++) {
            const initData = initDataList[i];
            await this.processAccount(initData, i + 1);
            await this.waitWithCountdown(3);
        }
        await this.waitWithCountdown(86400);
    }
}

if (require.main === module) {
    const vana = new Vana();
    vana.main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
