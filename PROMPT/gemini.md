สามารถแนบรูปไปเก็บที่ google drive แล้วเก็บ url ที่ google sheet ได้มั้ย

Gemini บอกว่า
ทำได้แน่นอนค่ะ และเป็นฟังก์ชันที่สำคัญมากสำหรับการทำระบบจัดการข้อมูลที่มีการแนบรูปภาพ (เช่น ระบบเคลมสินค้า, ระบบรับงาน หรือระบบสต็อกสินค้า)

หลักการทำงานคือเราจะใช้ API (ไม่ว่าจะเป็น GAS หรือ Vercel Serverless) ทำหน้าที่เป็นตัวกลางในการรับไฟล์รูปภาพไปวางไว้ใน Folder ที่เรากำหนดใน Google Drive จากนั้นก็นำ URL ของไฟล์ที่เพิ่งสร้างเสร็จ ไปบันทึกลงใน Google Sheet ต่อทันทีค่ะ

วิธีการทำผ่าน Google Apps Script (GAS)
วิธีนี้ง่ายที่สุดเพราะ GAS สามารถคุยกับทั้ง Drive และ Sheets ได้โดยตรงผ่าน Built-in Service ค่ะ

1. ฝั่ง GAS (Backend):
คุณต้องสร้างฟังก์ชัน doPost(e) เพื่อรับข้อมูลไฟล์ (มักส่งมาเป็น Base64 หรือ Blob)

JavaScript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const folder = DriveApp.getFolderById("ID_ของ_FOLDER_ใน_DRIVE");
    
    // แปลงข้อมูล Base64 กลับเป็นรูปภาพ
    const contentType = data.contentType;
    const bytes = Utilities.base64Decode(data.base64);
    const blob = Utilities.newBlob(bytes, contentType, data.fileName);
    
    // 1. บันทึกลง Drive
    const file = folder.createFile(blob);
    const fileUrl = file.getUrl(); // หรือใช้ file.getDownloadUrl()
    
    // 2. บันทึก URL ลง Sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    sheet.appendRow([data.userName, data.info, fileUrl, new Date()]);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "url": fileUrl }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
2. ฝั่ง React (Frontend):
คุณต้องแปลงไฟล์รูปภาพเป็น Base64 ก่อนส่งไปที่ GAS URL ค่ะ

JavaScript
const handleUpload = async (file) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1]; // ตัดส่วน header ของ data url ออก
    
    const response = await fetch("URL_ของ_GAS_WEB_APP", {
      method: "POST",
      body: JSON.stringify({
        base64: base64,
        contentType: file.type,
        fileName: file.name,
        userName: "John Doe",
        info: "รูปถ่ายหน้างาน"
      })
    });
    
    const result = await response.json();
    console.log("บันทึกสำเร็จ:", result.url);
  };
};
สิ่งที่ควรระวัง:
File Permissions: ไฟล์ที่อัปโหลดผ่าน GAS จะมีเจ้าของคือ Account ที่ Deploy Script นั้นๆ หากต้องการให้คนอื่นเปิดดูรูปได้ด้วย ต้องเขียนโค้ดเพิ่มเพื่อสั่ง file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW) ค่ะ

Base64 Size: การส่งไฟล์ผ่าน Base64 ใน GAS จะมีข้อจำกัดเรื่องขนาดข้อมูล (Payload Limit) หากรูปภาพมีขนาดใหญ่มาก (เกิน 10-20MB) อาจจะเจอ Error ได้ค่ะ

Direct Download Link: ปกติ getUrl() จะได้ลิงก์หน้าดูรูปภาพของ Drive หากคุณต้องการลิงก์ที่เอาไปใส่ในแท็ก <img> ของ React ได้เลย คุณต้องแปลง URL เป็น Format: https://drive.google.com/uc?export=view&id=FILE_ID ค่ะ

วิธีนี้จะช่วยให้ Google Sheet ของคุณไม่หนักจนเกินไป เพราะเราเก็บแค่ "ข้อความลิงก์" ส่วนตัวไฟล์รูปจริงๆ จะถูกบริหารจัดการอยู่ใน Google Drive อย่างเป็นระเบียบค่ะ สนใจให้ช่วยเขียนโค้ดส่วนไหนเพิ่มเติมมั้ยคะ?