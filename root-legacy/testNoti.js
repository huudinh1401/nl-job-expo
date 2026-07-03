// testNoti.js
const expoPushUrl = "https://exp.host/--/api/v2/push/send";

const notificationTemplates = {
    new_job: {
        title: "Thông báo",
        body: "Bạn có công việc mới, xem ngay!",
        data: {
            type: "new_job",
        },
    },
    edit_job: {
        title: "Thông báo",
        body: "Công việc của bạn đã được cập nhật nội dung mới!",
        data: {
            type: "edit_job",
        },
    },
    delete_job: {
        title: "Thông báo",
        body: "Công việc của bạn đã được HỦY BỎ bởi Đội trưởng!",
        data: {
            type: "delete_job",
        },
    },
};

async function sendPushNotification(token, type) {
    const template = notificationTemplates[type];

    if (!template) {
        throw new Error(`Loại thông báo không hợp lệ: ${type}`);
    }

    const messages = [
        {
            to: token,
            sound: "default",
            ...template,
        },
    ];

    const response = await fetch(expoPushUrl, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
    });

    const data = await response.json();
    console.log("Kết quả:", data);
}

const testToken = "ExponentPushToken[Ky4gLWMER2KxSX4hQTlnlB]";
const testType = "edit_job"; // đổi thành: new_job | edit_job | delete_job

sendPushNotification(testToken, testType).catch(console.error);


// await sendPushNotification(user.device_token, "new_job");