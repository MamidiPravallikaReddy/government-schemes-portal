const axios = require('axios');
const { logger } = require('../utils/logger');

/**
 * OTP Service for sending and verifying SMS OTPs
 * Supports multiple SMS providers
 */
class OTPService {
  constructor() {
    this.provider = process.env.OTP_PROVIDER || 'twilio'; // twilio, aws_sns, vonage, msg91
    this.maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;
    this.otpExpiry = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  }

  /**
   * Send OTP via SMS
   * @param {string} phone - 10-digit phone number
   * @param {string} otpCode - 6-digit OTP code
   * @returns {Promise<boolean>} - Success status
   */
  async sendOTP(phone, otpCode) {
    try {
      // In development/demo mode, log instead of sending
      if (
        process.env.NODE_ENV === 'development' ||
        ['demo', 'development'].includes((process.env.OTP_PROVIDER || '').toLowerCase())
      ) {
        logger.warn(`[DEMO MODE] OTP for ${phone}: ${otpCode}`);
        return true;
      }

      switch (this.provider) {
        case 'twilio':
          return await this.sendViaTwilio(phone, otpCode);
        case 'aws_sns':
          return await this.sendViaAWSSNS(phone, otpCode);
        case 'vonage':
          return await this.sendViaVonage(phone, otpCode);
        case 'msg91':
          return await this.sendViaMsg91(phone, otpCode);
        default:
          logger.warn(`Unknown OTP provider: ${this.provider}`);
          return false;
      }
    } catch (error) {
      logger.error('OTP Send Error:', error);
      return false;
    }
  }

  /**
   * Send OTP via Twilio
   */
  async sendViaTwilio(phone, otpCode) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      const message = `Your Government Schemes Portal verification code is: ${otpCode}. Valid for 10 minutes. Do not share this code.`;

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          From: fromNumber,
          To: `+91${phone}`,
          Body: message,
        },
        {
          auth: {
            username: accountSid,
            password: authToken,
          },
        }
      );

      logger.info(`OTP sent via Twilio to ${phone}: ${response.data.sid}`);
      return response.data.sid ? true : false;
    } catch (error) {
      logger.error('Twilio OTP Error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send OTP via AWS SNS
   */
  async sendViaAWSSNS(phone, otpCode) {
    try {
      const AWS = require('aws-sdk');
      const sns = new AWS.SNS({
        region: process.env.AWS_REGION || 'ap-south-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

      const message = `Your Government Schemes Portal verification code is: ${otpCode}. Valid for 10 minutes.`;

      const params = {
        Message: message,
        PhoneNumber: `+91${phone}`,
      };

      const result = await sns.publish(params).promise();
      logger.info(`OTP sent via AWS SNS to ${phone}: ${result.MessageId}`);
      return result.MessageId ? true : false;
    } catch (error) {
      logger.error('AWS SNS OTP Error:', error);
      return false;
    }
  }

  /**
   * Send OTP via Vonage (Nexmo)
   */
  async sendViaVonage(phone, otpCode) {
    try {
      const apiKey = process.env.VONAGE_API_KEY;
      const apiSecret = process.env.VONAGE_API_SECRET;
      const fromName = process.env.VONAGE_FROM_NAME || 'Schemes';

      const message = `Your Government Schemes Portal OTP is: ${otpCode}. Valid for 10 minutes. Do not share.`;

      const response = await axios.post(
        'https://rest.nexmo.com/sms/json',
        {
          api_key: apiKey,
          api_secret: apiSecret,
          to: `91${phone}`,
          from: fromName,
          text: message,
        }
      );

      if (response.data.messages[0]['status'] === '0') {
        logger.info(`OTP sent via Vonage to ${phone}: ${response.data.messages[0]['message-id']}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Vonage OTP Error:', error);
      return false;
    }
  }

  /**
   * Send OTP via MSG91
   */
  async sendViaMsg91(phone, otpCode) {
    try {
      const authKey = process.env.MSG91_AUTH_KEY;
      const route = process.env.MSG91_ROUTE || 'otp';
      const templateId = process.env.MSG91_TEMPLATE_ID;

      const message = `Your Government Schemes Portal verification code is: ${otpCode}. Valid for 10 minutes.`;

      const response = await axios.get(
        'https://control.msg91.com/api/sendotp.php',
        {
          params: {
            authkey: authKey,
            mobile: `91${phone}`,
            message: message,
            sender: 'SCHEMES',
            route: route,
            template_id: templateId,
          },
        }
      );

      if (response.data.type === 'success') {
        logger.info(`OTP sent via MSG91 to ${phone}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('MSG91 OTP Error:', error);
      return false;
    }
  }

  /**
   * Send OTP via FastOTP (Alternative provider)
   */
  async sendViaFastOTP(phone, otpCode) {
    try {
      const apiKey = process.env.FASTOTP_API_KEY;

      const message = `${otpCode} is your verification code for Government Schemes Portal. Valid for 10 minutes.`;

      const response = await axios.post(
        'https://api.fast-otp.com/send',
        {
          api_key: apiKey,
          phone: `91${phone}`,
          message: message,
        }
      );

      logger.info(`OTP sent via FastOTP to ${phone}`);
      return response.data.success === true;
    } catch (error) {
      logger.error('FastOTP OTP Error:', error);
      return false;
    }
  }

  /**
   * Generate random 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate OTP format
   */
  validateOTPFormat(code) {
    return /^[0-9]{6}$/.test(code);
  }

  /**
   * Get OTP expiry time
   */
  getExpiryTime() {
    return new Date(Date.now() + this.otpExpiry * 60 * 1000);
  }

  /**
   * Get OTP message
   */
  getOTPMessage(code) {
    return `Your Government Schemes Portal verification code is: ${code}. Valid for ${this.otpExpiry} minutes. Do not share this code with anyone.`;
  }
}

module.exports = new OTPService();
