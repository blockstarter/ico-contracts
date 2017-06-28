import React                from 'react';
import MuiThemeProvider     from 'material-ui/styles/MuiThemeProvider';
import CircularProgress     from 'material-ui/CircularProgress';
import {Tabs, Tab}          from 'material-ui/Tabs';
import TextField            from 'material-ui/TextField';
import Dialog               from 'material-ui/Dialog';
import FlatButton           from 'material-ui/FlatButton';
import {green500}           from 'material-ui/styles/colors';

import API                  from './tokenAPI';
import TokenInfo            from './TokenInfo';
import TokenEvents          from './TokenEvents';
import TokenActions         from './TokenActions';
import './App.css';

const web3 = window.web3;


export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tokenAddress: '',
      tokenMsg: null,
      tokenInfo: null,
      tokenEvents: null,
      defaultAccount: null,
      isDialogOpen: false
    };
  }


  _trackAccountInterval = null;

  componentDidMount() {
    if(!web3) return;
    API.checkNetwork().then(res => {
      this.setState(
        { tokenAddress: res.tokenAddress,
          tokenMsg: {text: res.networkName, ok: true}
        },
        this._loadTokenInfo
      );

      // track account changes
      this._trackAccountInterval = setInterval(() => {
        if (web3.eth.accounts[0] !== this.state.defaultAccount) {
          web3.eth.defaultAccount = web3.eth.accounts[0];
          this.setState({defaultAccount: web3.eth.accounts[0]});
        }
      }, 600);
    })
  }


  componentWillUnmount() {
    clearInterval(this._trackAccountInterval);
  }


  _loadTokenInfo = () =>
    API.getTokenInfo(this.state.tokenAddress)
      .then(tokenInfo => this.setState({
        tokenInfo,
        defaultAccount: web3.eth.accounts[0]
      }))
      .catch(err => {
        console.log('ERROR', err);
        this.setState({tokenMsg: {text: "Unexpected error, sorry"}})
        if(err.INVALID_TOKEN_ADDRESS) {
          this.setState({tokenMsg: {text: "Invalid address format"}})
        } else if(err.INVALID_TOKEN_NAME) {
        } else if(err.message) {
        }
      })


  _changeTab = tab => {
    switch(tab.props.value) {
      case "events": {
        API.getTokenEvents(this.state.tokenInfo.tokenManager.address)
          .then(tokenEvents => this.setState({tokenEvents}));
        break;
      }
      default: break;
    }
  }


  _closeDialog = () => this.setState({isDialogOpen: false}, this._loadTokenInfo)


  _notifyTransaction = res => {
    const txUrl = "https://testnet.etherscan.io/tx/" + res.tx;
    this.setState({
      isDialogOpen: true,
      dialogTitle: "Transaction submitted",
      dialogText: <p>
        You can see submitted transaction here <a href={txUrl}>here</a>.
        Please wait while it is mined and refresh the page.
      </p>
    })
  }


  _onActionSetPhase = newPhase => {
    const {tokenInfo} = this.state;
    API.setPhase(tokenInfo.address, newPhase, tokenInfo.tokenManager.address)
      .then(this._notifyTransaction)
  }


  _onActionWithdraw = () => {
    const {tokenInfo} = this.state;
    API.withdrawEther(tokenInfo.address, tokenInfo.tokenManager.address)
      .then(this._notifyTransaction)
  }

  _onActionConfirmTx = tx => {
    const {tokenInfo} = this.state;
    API.confirmTransaction(tx, tokenInfo.tokenManager.address)
      .then(this._notifyTransaction)
  }

  _buyTokens = value =>
    API.buyTokens(this.state.tokenAddress, value)
      .then(this._notifyTransaction)


  render() {
    if(!window.web3) {
      return <div className="App"><NoWeb3Notification/></div>;
    }

    const spinner = (
      <CircularProgress
         size={80} thickness={5}
         style={{display: 'block', margin: '20px auto'}}
      />);

    const state = this.state;

    return (
      <MuiThemeProvider>
        <div className="App">
          <TokenAddress
            tokenAddress={state.tokenAddress}
            tokenMsg={state.tokenMsg}
          />
          { // address is not validated yet
            window.web3 && !this.state.tokenInfo && !this.state.tokenMsg && spinner
          }
          { this.state.tokenInfo &&
            <Tabs>
              <Tab label="Token Info" value="info">
                <TokenInfo info={this.state.tokenInfo} onBuyTokens={this._buyTokens}/>
              </Tab>
              <Tab label="Events" value="events" onActive={this._changeTab}>
                { this.state.tokenEvents
                    ? <TokenEvents events={this.state.tokenEvents}/>
                    : <div>
                      <p>Fetching events is quite a slow operation. Please sit back and relax.</p>
                      { spinner }
                      </div>
                }
              </Tab>
              <Tab label="Actions" value="actions">
                <TokenActions
                  info={this.state.tokenInfo}
                  defaultAccount={this.state.defaultAccount}
                  onSetPhase={this._onActionSetPhase}
                  onWithdraw={this._onActionWithdraw}
                  onConfirmTx={this._onActionConfirmTx}
                />
              </Tab>
            </Tabs>
          }
          <Dialog
            open={this.state.isDialogOpen}
            onRequestClose={this._closeDialog}
            title={this.state.dialogTitle}
            actions={[
              <FlatButton label="Close" primary={true} keyboardFocused={true}
                onTouchTap={this._closeDialog}
              />
            ]}
          >
           { this.state.dialogText }
          </Dialog>
        </div>
      </MuiThemeProvider>
    );
  }
}

const TokenAddress = props => {
  const {tokenAddress, tokenMsg} = props;
  const addressStyle = {
    textAlign: 'center',
    fontSize: '20px',
    color: 'grey'
  };
  const errorStyle = props.tokenMsg && props.tokenMsg.ok
    ? { color: green500 }
    : {};

  return (
    <TextField
      hintText="Token address"
      style={{margin: '20px 0'}}
      fullWidth={true}
      disabled={true}
      inputStyle={addressStyle}
      errorStyle={errorStyle}
      errorText={tokenMsg && tokenMsg.text}
      value={tokenAddress}
    />
  );
};

const NoWeb3Notification = () =>
  <div>
    <p>
      No Ethereum network provider is detected.
      There are several ways to fix this:
    </p>
    <ul>
      <li>install <a href="https://metamask.io">MetaMask</a> browser plugin</li>
      <li>install <a href="https://github.com/ethcore/parity-extension">Parity</a> browser plugin</li>
      <li>open this page in <a href="https://github.com/ethereum/mist/releases">Mist</a> browser</li>
    </ul>
    <p>
      Find more info on this project on <a href="https://github.com/sonm-io/token">github</a>.
    </p>
  </div>;
