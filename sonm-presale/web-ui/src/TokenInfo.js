import React                from 'react';
import TextField            from 'material-ui/TextField';
import RaisedButton         from 'material-ui/RaisedButton';
import RandomIcon           from 'material-ui/svg-icons/places/ac-unit';

import
  { Table, TableBody, TableRow, TableRowColumn
  } from 'material-ui/Table';


export default class TokenInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { etherVal: '' };
  }


  _etherValChanged = ev => this.setState({
    etherVal: ev.target.value.replace(/[^\.0-9]/g, '')
  });

  _buyTokens = () => this.props.onBuyTokens(this.state.etherVal);


  render() {
    const {info} = this.props;

    const row = (name, value) => (
      <TableRow>
        <TableRowColumn>{name}</TableRowColumn>
        <TableRowColumn>{value}</TableRowColumn>
      </TableRow>
    );

    const phaseBlock =
      [ <p><b>Presale is not yet started.</b> Please check this page later.</p>
      , <div>
          <p><b>Presale is in progress.</b> You can buy some tokens here.</p>
          <div style={{textAlign: 'center'}}>
            <TextField hintText="Value in Ether"
              value={this.state.etherVal}
              onChange={this._etherValChanged}
            />
            <RaisedButton
              secondary={true}
              icon={<RandomIcon/>}
              label="Buy tokens"
              style={{margin: '12px'}}
              onClick={this._buyTokens}
              disabled={!this.state.etherVal}
            />
          </div>
        </div>
      , <p><b>Presale is paused.</b> Please come back later.</p>
      , <p><b>Presale is over.</b> You can now migrate your tokens.</p>
      , <p><b>Presale is over.</b> Migration is over too.</p>
      ];

    return (
      <div>
        <Table selectable={false}>
          <TableBody displayRowCheckbox={false}>
            {row("Name", info.name)}
            {row("Symbol", info.symbol)}
            {row("Price", `${info.price} ${info.symbol} per 1 ETH`)}
            {row("Tokens sold", `${info.supply} ${info.symbol}`)}
            {row("Current balance", `${info.balance} ETH`)}
          </TableBody>
        </Table>
        { phaseBlock[info.currentPhase] }
      </div>
    );
  }
}
