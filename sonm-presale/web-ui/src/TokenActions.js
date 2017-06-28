import React                from 'react';
import TextField            from 'material-ui/TextField';
import RaisedButton         from 'material-ui/RaisedButton';
import List                 from 'material-ui/List/List';
import ListItem             from 'material-ui/List/ListItem';
import Subheader            from 'material-ui/Subheader';

import IconPerson           from 'material-ui/svg-icons/social/person';
import IconMoney            from 'material-ui/svg-icons/editor/attach-money';
import IconMoneyOff         from 'material-ui/svg-icons/editor/money-off';
import IconBusiness         from 'material-ui/svg-icons/places/business-center';
import IconBlur             from 'material-ui/svg-icons/image/blur-on';
import IconSync             from 'material-ui/svg-icons/notification/sync';
import IconCheck            from 'material-ui/svg-icons/navigation/check';
import {yellow500, grey500} from 'material-ui/styles/colors';

import
  { Table, TableBody, TableRow, TableRowColumn
  } from 'material-ui/Table';


export default function(props) {
  const {info, defaultAccount} = props;

  const row = (name, value) => (
    <TableRow>
      <TableRowColumn style={{width: '31%'}}>{name}</TableRowColumn>
      <TableRowColumn>{value}</TableRowColumn>
    </TableRow>
  );

  const managerIcon = addr =>
    <IconPerson
      color={addr === defaultAccount ? yellow500 : grey500}
    />;

  const isManager = info.tokenManager.managers.includes(defaultAccount);

  const button = (icon, label, action) =>
    <RaisedButton secondary={true}
      icon={icon}
      label={label}
      onTouchTap={action}
    />;

  const action = (text1, text2, icon, act) =>
    <ListItem insetChildren={true}
      primaryText={text1}
      secondaryText={text2}
      primaryTogglesNestedList={true}
      leftIcon={icon}
      nestedItems={[
        <ListItem key={0} disabled={true} insetChildren={true}>
          {act}
        </ListItem>
      ]}
    />;

  return (
    <div className="Actions">
      <Table selectable={false}>
        <TableBody displayRowCheckbox={false}>
          {row("Multisig address", info.tokenManager.address)}
          {row("Multisig balance", `${info.tokenManager.balance} ETH`)}
          {row("Crowdsale address", info.crowdsaleManager.address)}
        </TableBody>
      </Table>
      <List>
        <Subheader inset={true}>Presale managers</Subheader>
        { info.tokenManager.managers.map((man, i) =>
          <ListItem key={i} disabled={true}
            leftIcon={managerIcon(man)}
            primaryText={man}
          />
        )}
        { info.tokenManager.pendingActions.length > 0 &&
          <div>
            <Subheader inset={true}>Pending actions</Subheader>
            {info.tokenManager.pendingActions.map((act, i) =>
              <ListItem key={i}
                insetChildren={true}
                primaryTogglesNestedList={true}
                primaryText={act.name}
                secondaryText={`Confirmed by ${act.confirmations.length} manager(s)`}
                nestedItems={
                  act.confirmations.map((man, i) =>
                    <ListItem key={i} disabled={true}
                      leftIcon={managerIcon(man)}
                      primaryText={man}
                    />
                  ).concat(
                    <ListItem key={-1} disabled={true} insetChildren={true}>
                      {!act.confirmations.includes(defaultAccount) &&
                        button(<IconCheck/>, "Confirm", () => props.onConfirmTx(act.txId))}
                    </ListItem>
                  )
                }
              />
            )}
          </div>
        }

        { !isManager &&
          <ListItem disabled={true}
            primaryText="You have no power here"
            secondaryText="Only presale managers can execute actions."
          />
        }

        { isManager &&
          <div>
            <Subheader inset={true}>Available actions</Subheader>
            { info.currentPhase === 0 &&
              action(
                "Start presale",
                "Presale is not running. Investors can't buy tokens yet.",
                <IconMoney/>,
                button(<IconMoney/>, "Start presale", () => props.onSetPhase(1)))
            }
            { info.currentPhase === 1 &&
              action(
                "Pause presale",
                "You can pause presale to prevent investors from buyig tokens.",
                <IconMoneyOff/>,
                button(<IconMoneyOff/>, "Pause presale", () => props.onSetPhase(2)))
            }
            { info.currentPhase === 2 &&
              action(
                "Resume presale",
                "Presale is paused. Investors can't buy tokens until you resume it.",
                <IconMoney/>,
                button(<IconMoney/>, "Resume presale", () => props.onSetPhase(1)))
            }
            { info.balance > 0 &&
              action(
                "Withdraw funds to multisig contract",
                "There are some Ether on presale contract.",
                <IconBusiness/>,
                button(<IconBusiness/>, "Withdraw ether", props.onWithdraw))
            }
            { info.currentPhase < 3 &&
              action(
                "Set crowdsale manager address",
                "You need it ot be set before token migration.",
                <IconBlur/>,
                <div className="set-cs-addr">
                  <TextField hintText="Address"
                    value={''}
                    onChange={null}
                  />
                  { button(<IconBlur/>, "Set address") }
                </div>)
            }
            { (info.currentPhase === 1 || info.currentPhase === 2) &&
              info.crowdsaleManager.address !== "0x0000000000000000000000000000000000000000" &&
              action(
                "Start token migration",
                "Token migration is controlled by crowdsale manager.",
                <IconSync/>,
                button(<IconBlur/>, "Start migration", () => props.onSetPhase(3)))
            }
          </div>
        }
      </List>
    </div>
  );
}
