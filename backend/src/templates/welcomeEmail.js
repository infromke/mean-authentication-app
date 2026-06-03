const welcomeEmail = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-br">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Welcome to Authentication System!</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #f3f4f6">
    <table
      border="0"
      cellpadding="0"
      cellspacing="0"
      width="100%"
      style="background-color: #f3f4f6"
    >
      <tr>
        <td align="center" style="padding: 20px 0">
          <table
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="600"
            style="
              font-family: Arial, Helvetica, sans-serif;
              font-size: 16px;
              color: #1c1d21;
              width: 90%;
              max-width: 600px;
              margin: 0 auto;
            "
          >
            <tbody>
              <tr>
                <td
                  align="left"
                  style="padding-top: 36px; padding-bottom: 22px"
                >
                  <img
                    style="display: block; border: 0"
                    src="https://i.postimg.cc/6QR9sQ7f/logoipsum-full.png"
                    alt="Logoipsum Network"
                    height="42"
                  />
                </td>
              </tr>

              <tr>
                <td style="background-color: #ffffff; padding: 32px">
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                  >
                    <tr>
                      <td style="font-size: 16px; line-height: 24px">
                        Dear {{user}},
                      </td>
                    </tr>
                    <tr>
                      <td
                        style="
                          padding-top: 24px;
                          font-size: 16px;
                          line-height: 24px;
                        "
                      >
                        Welcome to a very simple website made with MongoDB,
                        Express.js, React and Node.js!
                      </td>
                    </tr>
                    <tr>
                      <td
                        style="
                          padding-top: 24px;
                          font-size: 16px;
                          line-height: 24px;
                        "
                      >
                        You are receiving this message because you have created
                        an account with the following e-mail:
                        <span style="color: #135dfb; font-weight: 600"
                          >{{email}}</span
                        >. If you don't know what this is about, you are free to ignore it.
                      </td>
                    </tr>
                    <tr>
                      <td
                        style="
                          padding-top: 24px;
                          font-size: 16px;
                          line-height: 24px;
                        "
                      >
                        Sincerely,
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 16px; line-height: 24px">
                        <a
                          href="https://github.com/infromke"
                          target="_blank"
                          style="
                            text-decoration: none;
                            color: #135dfb;
                            font-weight: bold;
                          "
                          >infromke</a
                        >
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td
                  align="center"
                  style="
                    font-size: 12px;
                    padding: 24px 0;
                    color: #6a7181;
                    line-height: 18px;
                  "
                >
                  This e-mail can be replied to, but I won't answer you. <br />
                  Thank you for your time.
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

export default welcomeEmail
