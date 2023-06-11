# Vanity-ENS

This is a simple web application that allows users to generate Ethereum vanity addresses for any given ENS name. It checks if an ENS name is available and then uses the ethereumjs-util library to generate addresses until it finds one that matches the given ENS name.

The project is built with NextJS and Tailwind CSS.

## Features

- Enter any ENS name to generate a vanity address.
- Check ENS name availability.
- Shows the time taken and the number of addresses generated.
- Once the vanity address is generated, it provides the private key for the generated address. The private key is hidden by default and can be shown by clicking on the 'Show' button.

## Usage

1. Clone the repository.

   ```
   git clone https://github.com/portdeveloper/vanity-ens.git
   ```

2. Install the dependencies.

   ```
   npm install
   ```

3. Start the development server.

   ```
   npm start
   ```

Visit `http://localhost:3000` in your web browser to access the application.

## Warning

The private key of the generated address is shown in the application. Be very careful with this information. If someone else gains access to this private key, they will have control over the Ethereum account associated with it.

## Contributing

Pull requests are welcome.

## License

[MIT](https://choosealicense.com/licenses/mit/)
